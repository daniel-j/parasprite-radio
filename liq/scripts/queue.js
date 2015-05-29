#!/usr/bin/env node
'use strict'
var net = require('net')
var config = require(__dirname+'/../../config.json')

var client = net.connect(config.liquidsoap.port, config.liquidsoap.host)

client.pipe(process.stdout)

client.on('connect', function () {
	if (process.argv[2]) {
		client.write("smartqueue "+process.argv[2]+"\r\n")
	}
	client.write("request.queue\r\n")
	client.write("quit\r\n")
	client.end()
})
