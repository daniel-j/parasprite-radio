'use strict'

var utils = require('../utils')
var config = require(__dirname+'/../../../scripts/config')

var root = "https://api.soundcloud.com"

function protocol(arg, parsedUrl, handleCb) {

	utils.handleAPI(root+"/resolve.json?url="+encodeURIComponent(process.argv[2])+"&client_id="+config.soundcloud.clientId, outputTrack)

	function outputTrack(track) {

		if (track.kind !== 'track') {
			handleCb({what: protocol.title, error: "Not a track."})
			return
		}

		var arturl = track.artwork_url || track.user.avatar_url
		var year = parseInt(track.created_at, 10) // format: "2015/04/22 22:12:30 +0000"
		var audiourl = ""
		var format = "mp3"
		if (track.downloadable && track.original_format !== "wav") {
			audiourl = track.download_url
			format = track.original_format
		} else if (track.streamable) {
			audiourl = track.stream_url
		} else {
			handleCb({what: protocol.title, error: "No stream url found."})
			return
		}
		audiourl += "?client_id="+config.soundcloud.clientId+"&liquidformat=."+format

		handleCb({
			title: track.title,
			artist: track.user.username,
			url: track.permalink_url,
			art: arturl,
			time: Math.round(track.duration/1000),
			year: year,

			source: audiourl
		})
	}
}

protocol.title = "Soundcloud"

module.exports = protocol
