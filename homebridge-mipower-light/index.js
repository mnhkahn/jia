"use strict";
const miio = require('miio');
const net = require('net');
var http = require('http');
let Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    homebridge.registerAccessory("homebridge-mipower", "MiLight", MiAccessory);
};

function MiAccessory(log, config) {
    if (!config["ip"] || !config["token"] || !config["name"]) {
        log.error("Please define name and host in config.json");
    }
    this.autoUpdate = config["autoupdate"] != null;
    this.name = config["name"];
    this.log = log;
    if (this.autoUpdate) this.verifyUpdate();
    this.ip = config["ip"];
    this.token = config["token"];
    this.UUID = UUIDGen.generate(this.name);
    this.ambilightName = config["ambilightName"];
    this.lightService = new Service.Lightbulb(this.name);
    this.lightService.subtype = this.name;
    this.infoService = new Service.AccessoryInformation();
}

MiAccessory.prototype.getServices = function() {
    let services = [];

    this.light = miio.device({ address: this.ip, token: this.token })
        .then(device => console.log('Connected to', device))
        .catch(err => handleErrorHere);

    this.lightService
        .getCharacteristic(Characteristic.On)
        .on('set', (value, callback) => {
            this.log.error("set light", value);
            this.light.setPower(value);

        })
        .on('get', (callback) => {
            this.log.error("get light status", this.host, this.port);
            this.light.power()
                .then(function(isOn) {
                    callback(null, isOn);
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