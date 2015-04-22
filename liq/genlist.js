#!/usr/bin/env node
'use strict';

var mpd = require('mpd');
var fs = require('fs');
var cmd = mpd.cmd;

var client = mpd.connect({
	port: 6600,
	host: '127.0.0.1'
});

function getPlaylist() {
	console.log("Reading playlist...");
	client.sendCommand(cmd("listplaylistinfo", ['radio']), function(err, msg) {
		if (err) {
			console.error(err);
			return;
		}

		var playlist = msg.split("\nfile: ");

		for (var i = 0; i < playlist.length; i++) {
			if (i > 0) {
				playlist[i] = "file: "+playlist[i];
			}
			playlist[i] = playlist[i].split("\n");
			if (i === playlist.length-1) {
				playlist[i].pop();
			}
			var o = {};
			for (var j = 0; j < playlist[i].length; j++) {
				var line = playlist[i][j];
				var pos = line.indexOf(": ");
				if (pos !== -1) {
					var key = line.substr(0, pos).toLowerCase();
					var value = line.substr(pos+2);
					o[key] = value;
				}
			}
			o['time'] = +o['time'];
			delete o['file'];
			delete o['last-modified'];
			playlist[i] = o;
		}
		fs.writeFile(__dirname+'/playlist.json', JSON.stringify(playlist), function (err) {
			if (err) {
				console.error("Unable to write file. "+err);
				return;
			}
			console.log("Playlist updated!");
		});
	});
}

client.on('ready', function() {
	console.log("ready");
	getPlaylist();
});
client.on('system', function(name) {
	console.log("update", name);
	if (name === "stored_playlist" || name === "database") {
		getPlaylist();
	}
});
