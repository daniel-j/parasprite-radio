'use strict'

var spawn = require('child_process').spawn
var os = require('os')

function protocol(arg, parsedUrl, handleCb) {

	var yt = spawn('youtube-dl', ['--no-playlist', '--playlist-end', 1, '-j', '-f', 'bestaudio', arg])

	var output = ""

	yt.stdout.on('data', function (chunk) {
		output += chunk.toString('utf8')
	})
	yt.on('close', function () {
		var data = JSON.parse(output)
		delete data.formats
		fetchVideo(data, handleCb)
	})
}

function fetchVideo(data, cb) {
	var tempName = os.tmpdir()+'/tmp.yt.'+data.id+'.mp3'
	// joint stereo VBR2 mp3
	var ffmpeg = spawn('avconv', ['-i', data.url, '-codec:a', 'libmp3lame', '-q:a', 2, tempName])
	//var ffmpeg = spawn('ffmpeg', ['-i', data.url, '-codec:a', 'libmp3lame', '-q:a', 2, '-joint_stereo', 1, tempName])

	//ffmpeg.stdout.pipe(process.stderr)
	//ffmpeg.stderr.pipe(process.stderr)
	console.error("Downloading "+data.title+"...")

	data.filename = tempName
	//ffmpeg.on('close', function () {
	//})
	outputVideo(data, cb)
}

function outputVideo(video, cb) {

	//var url = video.url.replace(/\./g, "%2E")
	//url += "&filename=" + encodeURIComponent("v."+video.ext)

	cb({
		title: video.title,
		artist: video.uploader,
		url: video.webpage_url,
		art: video.thumbnail,
		temporary: true,

		source: video.filename
	})
}

protocol.title = "YouTube"

module.exports = protocol
