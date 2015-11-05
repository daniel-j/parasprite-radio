#!/usr/bin/env node
'use strict'
var net = require('net')
var config = require(__dirname+'/../../scripts/config')

var client = net.connect(config.liquidsoap.port_telnet, config.liquidsoap.host)

client.pipe(process.stdout)

client.once('connect', function () {
	if (process.argv[2]) {
		client.write('queue3.push smart:'+process.argv[2]+'\r\n')
	}
	client.write('quit\r\n')
	client.end()
})
