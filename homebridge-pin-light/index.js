"use strict";
const net = require('net');
var http = require('http');
let Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    homebridge.registerAccessory("homebridge-pinlight", "PinLight", PinAccessory);
};

function PinAccessory(log, config) {
    if (!config["host"] || !config["port"] || !config["name"]) {
        log.error("Please define name and host in config.json");
    }
    this.autoUpdate = config["autoupdate"] != null;
    this.name = config["name"];
    this.log = log;
    if (this.autoUpdate) this.verifyUpdate();
    this.host = config["host"];
    this.port = config["port"];
    this.UUID = UUIDGen.generate(this.name);
    this.ambilightName = config["ambilightName"];
    this.lightService = new Service.Lightbulb(this.name);
    this.lightService.subtype = this.name;
    this.infoService = new Service.AccessoryInformation();
}

PinAccessory.prototype.getServices = function() {
    let services = [];

    this.lightService
        .getCharacteristic(Characteristic.On)
        .on('set', (value, callback) => {
            this.log.error("set light", value);
            if (value) {
                http.get('http://' + this.host + ':' + this.port + '/light?command=on', function(res) {
                    var body = '';

                    res.on('data', function(chunk) {
                        body += chunk;
                    });
                    res.on('end', function() {
                        var data = JSON.parse(body);
                        callback(null, res.light == 1);
                    });
                });
            } else {
                http.get('http://' + this.host + ':' + this.port + '/light?command=off', function(res) {
                    var body = '';

                    res.on('data', function(chunk) {
                        body += chunk;
                    });
                    res.on('end', function() {
                        var data = JSON.parse(body);
                        callback(null, res.light == 1);
                    });
                });
            }
        })
        .on('get', (callback) => {
            this.log.error("get light status", this.host, this.port);
            http.get('http://' + this.host + ':' + this.port + '/light', function(res) {
                var body = '';

                res.on('data', function(chunk) {
                    body += chunk;
                });
                res.on('end', function() {
                    var data = JSON.parse(body);
                    callback(null, res.light == 1);
                });
            });
        });

    services.push(this.lightService);
    services.push(this.infoService);

    this.infoService
        // 设置制造商
        .setCharacteristic(Characteristic.Manufacturer, "Jia")
        // 设置型号
        .setCharacteristic(Characteristic.Model, this.host)
        // 设置序列号
        .setCharacteristic(Characteristic.SerialNumber, this.lightService.UUID);

    return services;
};