# bin/bash
GO_ENABLED=0 GOOS=linux GOARCH=arm go build light.go
scp light pi@10.0.1.38:/home/pi/code/gopath/src