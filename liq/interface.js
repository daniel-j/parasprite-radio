#!/usr/bin/env node
var net = require('net');

var client = net.connect(1234, "localhost");
client.pipe(process.stdout);



client.on('connect', function () {
	console.log("Connected!");
	process.stdin.on('data', function (data) {
		client.write(data.toString()+"\r\n");
	});
});
