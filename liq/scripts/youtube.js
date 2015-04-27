#!/usr/bin/env node
'use strict';

var spawn = require('child_process').spawn

var yturl = process.argv[2];

var yt = spawn('youtube-dl', ['--no-playlist', '--playlist-end', 1, '-j', '-f', 'bestaudio', yturl])

var output = ""

yt.stdout.on('data', function (chunk) {
	output += chunk.toString('utf8')
})
yt.on('close', function () {
	var data = JSON.parse(output)
	delete data.formats
	handleData(data)
})

function sayErr(err) {
	console.log("say:"+JSON.stringify("Youtube error. "+err).replace(/\:/g, '.'))
}

function outputVideo(video) {

	var url = video.url.replace(/\./g, "%2E")

	var idpos = url.indexOf("?id=")

	//url = url.substring(0, idpos) + "?filename=" + encodeURIComponent("v."+video.ext) + "&" + url.substring(idpos+1)
	var ext = video.ext
	//if (ext == 'm4a') ext = 'aac'
	url += "&filename=" + encodeURIComponent("v."+ext)
	//url = url.replace(/\&/g, "\\&")

	//url = 'http://localhost:8000/liq/yt?url='+encodeURIComponent(video.webpage_url)+"&filename=a.m4a"

	console.log('annotate:title='+JSON.stringify(video.title)+',artist='+JSON.stringify(video.uploader)+',url='+JSON.stringify(video.webpage_url)+',art='+JSON.stringify(video.thumbnail)+':'+url)
}

function handleData(data) {
	outputVideo(data)
}

