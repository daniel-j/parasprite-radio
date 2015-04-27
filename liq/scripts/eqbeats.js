#!/usr/bin/env node
'use strict';

var url = require('url')
var https = require('https')

function fetchJSON(url, callback) {
	https.get(url, function (res) {
		var data = ''

		res.on('data', function (chunk) {
			data += chunk
		})

		res.on('end', function () {
			try {
				var obj = JSON.parse(data)
				callback(null, obj)
			}
			catch (err) {
				callback(err)
			}
		})

	}).on('error', function (e) {
		callback(e.message)
	})
}

var root = "https://eqbeats.org"

var u = url.parse(process.argv[2], true)

var path = u.pathname.split("/")
var query = u.query



function sayErr(err) {
	console.log("say:"+JSON.stringify("Eqbeats error. "+err).replace(/\:/g, '.'))
}
function handleAPI(url, cb) {
	fetchJSON(root+url, function (err, data) {
		if (err) {
			sayErr("I was not able to parse "+url)
		} else {
			cb(data)
		}
	})
}

function outputTrack(track) {
	var id = track.id
	var arturl = track.download.art || track.artist.avatar

	console.log('annotate:title='+JSON.stringify(track.title)+',artist='+JSON.stringify(track.artist.name)+',url='+JSON.stringify(track.link)+(arturl?',art="https://eqbeats.org/track/'+id+'/art"':'')/*+(track.description?',comment='+JSON.stringify(track.description):'')*/+':https://eqbeats.org/track/'+id+'/mp3?file.mp3')
}

function outputFirstTrack(tracks) {
	outputTrack(tracks[0])
}


if (path[0] === 'track') {
	handleAPI("/track/"+path[1]+"/json", outputTrack)
} else if (path[0] === 'tracks' && path[1] === 'search' && query.q) {
	handleAPI("/tracks/search/json?q="+encodeURIComponent(query.q), outputFirstTrack)
}

