'use strict'

var spawn = require('child_process').spawn

function protocol(arg, parsedUrl, handleCb) {

	var ytdl = spawn('youtube-dl', ['--no-playlist', '--playlist-end', 1, '-j', arg])

	var output = ""

	ytdl.stdout.on('data', function (chunk) {
		output += chunk.toString('utf8')
	})
	ytdl.on('close', function () {
		var data = JSON.parse(output)
		delete data.formats
		outputMix(data, handleCb)
	})
}

function outputMix(mix, cb) {

	cb({
		title: mix.title,
		artist: mix.uploader,
		url: mix.webpage_url,
		art: mix.thumbnail,

		source: mix.url
	})
}

protocol.title = "Mixcloud"

module.exports = protocol
