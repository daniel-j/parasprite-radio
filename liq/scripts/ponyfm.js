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

var root = "https://pony.fm"

var u = url.parse(process.argv[2], true)

var path = u.pathname.split("/")
var query = u.query



function sayErr(err) {
	console.log("say:"+JSON.stringify("Pony FM error. "+err).replace(/\:/g, '.'))
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

function outputTrack(info) {
	var track = info.track
	var id = track.id
	var arturl = track.covers.normal
	var year = parseInt(track.published_at.date, 10) // format: "2015-04-18 05:33:53.000000"

	var audiourl = root+"/t"+id+"/dl.mp3"

	console.log('annotate:title='+JSON.stringify(track.title)+',artist='+JSON.stringify(track.user.name)+',url='+JSON.stringify(track.url)+(arturl?',art="'+arturl+'"':'')+',time="'+track.duration+'",year="'+year+'":'+audiourl)
}


if (path[0] === 'tracks') {
	handleAPI("/api/web/tracks/"+parseInt(path[1])+"?log=true", outputTrack) // log=true adds to viewcount
}

