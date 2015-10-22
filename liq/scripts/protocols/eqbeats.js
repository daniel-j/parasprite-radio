'use strict'

var utils = require('../utils')

var root = 'https://eqbeats.org'

function protocol(arg, parsedUrl, handleCb) {

	var path = parsedUrl.pathname.substr(1).split('/')
	var query = parsedUrl.query

	if (path[0] === 'track') {
		utils.handleAPI(root+'/track/'+path[1]+'/json', outputTrack)
	} else if (path[0] === 'tracks' && path[1] === 'search' && query.q) {
		utils.handleAPI(root+'/tracks/search/json?q='+encodeURIComponent(query.q), outputFirstTrack)
	}



	function outputTrack(track) {
		var id = track.id
		var arturl = track.download.art || track.artist.avatar

		handleCb({
			title: track.title,
			artist: track.artist.name,
			url: track.link,
			art: arturl,

			source: 'https://eqbeats.org/track/'+id+'/mp3?file.mp3'
		})
	}

	function outputFirstTrack(tracks) {
		outputTrack(tracks[0])
	}

}

protocol.title = 'Equestrian Beats'

module.exports = protocol
