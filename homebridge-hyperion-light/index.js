"use strict";
const net = require('net');
var http = require('http');
//const Hyperion = require('hyperion-js-api');
//const NpmAutoUpdate = require('npm-auto-update');
let Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    homebridge.registerAccessory("homebridge-hyperion", "Hyperion", HyperionAccessory);
};

function HyperionAccessory (log, config) {
    if (!config["host"] || !config["port"] || !config["name"]) {
        log.error("Please define name and host in config.json");
    }
    this.autoUpdate = config["autoupdate"] != null;
    this.name = config["name"];
    this.log = log;
    //this.npmAutoUpdate = new NpmAutoUpdate();
    if(this.autoUpdate) this.verifyUpdate();
    this.host = config["host"];
    this.port = config["port"];
    //this.hyperion = new Hyperion(config["host"], config["port"]);
    this.UUID = UUIDGen.generate(this.name);
    this.ambilightName = config["ambilightName"];
    this.lightService = new Service.Lightbulb(this.name);
    this.lightService.subtype = this.name;
    this.infoService = new Service.AccessoryInformation();
}

HyperionAccessory.prototype.verifyUpdate = function () {
    /*this.npmAutoUpdate.checkForUpdate((error, result) => {
        if (result) {
            this.npmAutoUpdate.updatePackage((error, result) => {
            });
        }
    });*/
};

HyperionAccessory.prototype.getServices = function () {
    let services = [];

    this.lightService
        .getCharacteristic(Characteristic.On)
        .on('set', (value, callback) => {
            this.log.error("set BBB");
 	    if (value) {
	        http.get('http://127.0.0.1:11947/light?command=on',function(res) {
            var body = '';

            res.on('data', function(chunk){
                body += chunk;
            });
                res.on('end',function() {
                     var data = JSON.parse(body);
                     callback(null, res.light==1);
                });
            });
            } else {
	        http.get('http://127.0.0.1:11947/light?command=off',function(res) {
            var body = '';

            res.on('data', function(chunk){
                body += chunk;
            });
                res.on('end',function() {
                     var data = JSON.parse(body);
                     callback(null, res.light==1);
                });
            });
            }
            /*if (value) {
                this.ambilightService.updateCharacteristic(Characteristic.On, 0);
                this.hyperion.setOn(callback);
            } else {
                this.hyperion.setOff(callback);
            }*/
        })
        .on('get', (callback) => {
            this.log.error("set BBB",this.host,this.port);
	    http.get('http://127.0.0.1:11947/light',function(res) {
	    var body = '';

            res.on('data', function(chunk){
                body += chunk;
            });
		res.on('end',function() {
                     var data = JSON.parse(body);
                     callback(null, res.light==1);
		});
            });
            //this.hyperion.getOn(callback);
        });
/*
    this.lightService
        .addCharacteristic(Characteristic.Brightness)
        .on('set', (value, callback) => {
            //this.hyperion.setBrightness(value, callback);
        })
        .on('get', (callback) => {
            this.hyperion.getBrightness(callback);
        });

    this.lightService
        .addCharacteristic(Characteristic.Hue)
        .on('set', (value, callback) => {
            //this.hyperion.setHue(value, callback);
        })
        .on('get', (callback) => {
            this.log.info("AAA");
            //this.hyperion.getHue(callback);
        });

    this.lightService
        .addCharacteristic(Characteristic.Saturation)
        .on('set', (value, callback) => {
            this.hyperion.setSaturation(value, callback);
        })
        .on('get', (callback) => {
            this.hyperion.getSaturation(callback);
        });
*/
    if (this.ambilightName && this.ambilightName.length > 0) {

        this.ambilightService = new Service.Switch(this.ambilightName);
        this.ambilightService.subtype = this.ambilightName;

        this.ambilightService
            .getCharacteristic(Characteristic.On)
            .on('set', (value, callback) => {
                this.log.info("AAA et",value);
                if (value) {
                    this.lightService.updateCharacteristic(Characteristic.On, 0);
                    this.hyperion.setAmbiStateOn(callback);
                } else {
                    this.hyperion.setOff(callback);
                }
            })
            .on('get', (callback) => {
                this.log.info("AAA get");
                //this.hyperion.getAmbiState(callback);
            });
        services.push(this.ambilightService);
    }

    services.push(this.lightService);
    services.push(this.infoService);

    this.infoService
        .setCharacteristic(Characteristic.Manufacturer, "Hyperion")
        .setCharacteristic(Characteristic.Model, this.host)
        .setCharacteristic(Characteristic.SerialNumber, this.lightService.UUID);

    return services;
};
