package main

import (
	"encoding/json"
	"log"
	"net"
	"net/http"
	"os"

	"github.com/stianeikeland/go-rpio"
)

var pin rpio.Pin

func PinStatus() string {
	switch rpio.ReadPin(pin) {
	case rpio.Low:
		return "low"
	case rpio.High:
		return "high"
	}
	return "N/A"
}

func main() {
	err := rpio.Open()
	if err != nil {
		os.Exit(1)
	}

	pin = rpio.Pin(14)
	pin.Mode(rpio.Output)

	defer func() {
		pin.Low()
		rpio.Close()
	}()

	port := "11947"
	log.Println("serve on", GetOutboundIP().String()+":"+port)
	http.HandleFunc("/light", LightHandler)

	log.Fatal(http.ListenAndServe(":"+port, nil))

}

func LightHandler(w http.ResponseWriter, r *http.Request) {
	res := make(map[string]interface{}, 1)

	params := r.URL.Query()
	command := params.Get("command")

	switch command {
	case "on":
		pin.High()
		log.Println("light on")
	case "off":
		pin.Low()
		log.Println("light off")
	}

	res["light"] = rpio.ReadPin(pin)

	data, err := json.Marshal(res)
	if err != nil {
		log.Println("error:", err)
	}
	w.Write(data)
}

func GetOutboundIP() net.IP {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)

	return localAddr.IP
}
