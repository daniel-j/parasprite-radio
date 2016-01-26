'use strict'

import api from './entities/api'

//let viewercount = document.getElementById('viewercount')
let liveplayer = document.getElementById('liveplayer')

let player = null

function startPlayer() {

	let id = 'jwplayer'
	player = jwplayer(id)
	window.jw = player
	player.setup({
		playlist: [
			{ file: config.livestream_url_dash, image: config.livestream_url_thumbnail+'?t='+Date.now() },
			{ file: config.livestream_url_hls, image: config.livestream_url_thumbnail+'?t='+Date.now() },
			{ file: config.livestream_url_rtmp, image: config.livestream_url_thumbnail+'?t='+Date.now() }
		],
		dash: true,
		androidhls: true,
		rtmp: {
			bufferlength: 2
		},
		height: '100%',
		width: '100%'
	})
	player.on('all', function () {
		document.getElementById(id).classList.remove('jw-flag-aspect-mode')
	})
}

api.events.on('livestreamstatus', function (data) {

	if (data.online) {
		viewercount.textContent = data.viewers
		liveplayer.classList.remove('offline')
		document.body.classList.add('livestreamonline')
	} else {
		viewercount.textContent = '-'
		liveplayer.classList.add('offline')
		player.stop()
		document.body.classList.remove('livestreamonline')
	}
})


startPlayer()

module.exports = player
