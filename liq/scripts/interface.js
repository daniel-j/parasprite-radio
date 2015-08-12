#!/usr/bin/env node
'use strict'
var net = require('net')
var config = require(__dirname+'/../../scripts/config')

var client = net.connect(config.liquidsoap.port_telnet, config.liquidsoap.host)
client.pipe(process.stdout)



client.on('connect', function () {
	console.log("Connected!")
	process.stdin.on('data', function (data) {
		client.write(data.toString()+"\r\n")
	})
})
