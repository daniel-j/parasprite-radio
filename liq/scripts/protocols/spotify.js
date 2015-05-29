'use strict'

var Spotify = require('../../../app/node_modules/spotify-web')
var login = require('../../../app/util/config').spotify
var fs = require('fs')
var temp = require('../../../app/node_modules/temp')


function protocol(arg, parsedUrl, handleCb) {
	// determine the URI to play, ensure it's a "track" URI
	var uri = "";
	if (arg.indexOf('spotify:') === 0) {
		uri = arg;
	} else {
		var p = parsedUrl.pathname.substr(1).split("/")
		uri = 'spotify:'+p.join(':')
	}
	
	var type = Spotify.uriType(uri)
	if ('track' != type) {
		handleCb({what: protocol.title, error: 'Must pass a "track" URI, got ' + JSON.stringify(type)})
		return
	}

	Spotify.login(login.username, login.password, function (err, spotify) {
		if (err) {
			spotify.disconnect()
			handleCb({what: protocol.title, error: err})
			return
		}

		// get a "Track" instance from the track URI
		spotify.get(uri, function (err, track) {
			if (err) {
				spotify.disconnect()
				handleCb({what: protocol.title, error: err})
				return
			}

			if (spotify.isTrackAvailable(track)) {
				var tempName = temp.path({suffix: '.mp3'})
				var t = track.play()
				var out = fs.createWriteStream(tempName)
				t.pipe(out).on('finish', function () {
					spotify.disconnect()
					outputTrack(track, tempName, handleCb)
				})

			} else {
				spotify.disconnect()
				handleCb({what: protocol.title, error: "Track not available"})
				return
			}

		})
	})
}

function outputTrack(track, filename, cb) {

	var arturl = ""
	var covers = track.album.cover
	if (covers) {
		for (var i = 0; i < covers.length; i++) {
			if (covers[i].size === 'LARGE' || covers[i].size === 'DEFAULT') {
				arturl = covers[i].uri
			}
		}
	}

	cb({
		title: track.name,
		artist: track.artist[0].name,
		album: track.album.name,
		albumartist: track.album.artist[0].name,
		//url: "https://open.spotify.com/"+track.uri.substr(8).replace(/\:/g, "/"),
		art: arturl,
		time: track.duration/1000,
		year: track.album.date.year,
		temporary: true,

		source: filename
	})
}

protocol.title = "Spotify"

module.exports = protocol
