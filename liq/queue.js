#!/usr/bin/env node
var net = require('net');

var client = net.connect(1234, "localhost");
client.pipe(process.stdout);

client.on('connect', function () {
	if (process.argv[2]) {
		client.write("request.push /mnt/"+process.argv[2]+"\r\n");
	}
	client.write("request.queue\r\n");
	client.write("quit\r\n");
	client.end();
});
