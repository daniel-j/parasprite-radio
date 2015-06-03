'use strict'

var utils = require('../utils')

var root = "https://bronytunes.com"

function protocol(arg, parsedUrl, handleCb) {
	var path = parsedUrl.pathname.substr(1).split("/")
	var query = parsedUrl.query

	if (path[0] === 'songs') {
		utils.handleAPI(root+"/retrieve_songs.php?client_type=radio", handleList)
	}

	function handleList(list) {
		var id = parseInt(path[1], 10)
		for (var i = 0; i < list.length; i++) {
			if (list[i].song_id == id) {
				outputTrack(list[i])
				break
			}
		}
	}

	function outputTrack(track) {
		var id = +track.song_id
		var arturl = "https://artwork3.bronytunes.com/retrieve_artwork.php?song_id="+id+"&aspect=wide&force_album_artwork=0&size=1024"
		var year = parseInt(track.release_date, 10) || null // format: "2015-04-18"

		var audiourl = "https://bronytunes.com/retrieve_song.php?song_id="+id+"&client_type=radio&fmt=.mp3"

		handleCb({
			title: track.name,
			artist: track.artist_name,
			album: track.album,
			albumartist: track.album_artist_name,

			url: root+"/songs/"+id,
			art: arturl,
			time: +track.duration,
			year: year,

			source: audiourl
		})
	}

}

protocol.title = "BronyTunes"

module.exports = protocol


