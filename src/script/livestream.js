'use strict'

import events from './entities/events'

//let viewercount = document.getElementById('viewercount')
let liveplayer = document.getElementById('liveplayer')

let player = null
let playerId = 'livevideoplayer'
let playerElement = document.getElementById(playerId)
let playerType = 'jw'
let isOnline = false
let socket = io('/livestream', {path: '/socket.io', autoConnect: false})
let enabled = false
let bufferTimer

let bitdashConf = {
	key: '3c1f43e7-c788-4f4a-a13c-ab3569f63bc0',
	source: {
		dash:   config.livestream_url_dash,
		hls:    config.livestream_url_hls,
		poster: config.livestream_url_thumbnail+'?t='+Date.now()
	},
	style: {
		height: '100%',
		width: '100%'
	},
	cast: {
		enable: true
	},

	logs: {
		bitmovin: false
	},
	tweaks: {
		//search_real_end: true
	},

	playback: {
		autoplay: true
	},

	events: {
		onPlay: function () {
			console.log('PLAY')
			socket.connect()
		},
		onPause: function () {
			console.log('PAUSE')
			socket.disconnect()
		},
		onSourceUnloaded: function () {
			console.log('UNLOADED')
			socket.disconnect()
		},
		onStartBuffering: function () {
			console.log('STALLED')
			clearTimeout(bufferTimer)
			bufferTimer = setTimeout(function () {
				if (!player || player.getTotalStalledTime() < 15) {
					return
				}
				API.stop()
				API.start()
			}, 15*1000)
		},
		onStopBuffering: function () {
			console.log('UNSTALLED')
			clearTimeout(bufferTimer)
		}
	}
}

var jwConfig = {
	playlist: [{
		image: config.livestream_url_thumbnail+'?t='+Date.now(), sources: [
			{ file: config.livestream_url_dash, label: 'DASH', type: 'application/dash+xml' },
			{ file: config.livestream_url_hls, label: 'HLS', type: 'application/vnd.apple.mpegurl' },
			{ file: config.livestream_url_rtmp, image: 'RTMP Flash', type: 'application/x-fcs' }
		]
	}],
	height: '100%',
	width: '100%',
	//autostart: true,
	primary: 'html5'
}


function startJwPlayer() {
	if (player || !isOnline || !enabled) {
		return
	}
	playerType = 'jw'


	player = jwplayer(playerId)
	window.jw = player
	player.setup(jwConfig)
	player.on('ready', function () {
		player.play()
	})
	player.on('play', function () {
		socket.connect()
	})
	player.on('pause', function () {
		socket.disconnect()
	})
	player.on('buffer', function () {

	})
}


function startBitDashPlayer() {
	if (player || !isOnline || !enabled) {
		return
	}
	playerType = 'bitdash'

	player = bitdash(playerId)
	window.player = player

	console.log('START PLAYER')
	bitdashConf.source.poster = config.livestream_url_thumbnail+'?t='+Date.now()

	player.setup(bitdashConf).then(function () {
		// Success
		console.log('Successfully created bitdash player instance')
	}, function (reason) {
		// Error!
		console.log('Error while creating bitdash player instance', reason)
		//startJwPlayer()
		player = null
		setTimeout(startBitDashPlayer, 5000)
	})
}

events.on('livestreamstatus', function (data) {
	isOnline = data.online
	if (data.online) {
		viewercount.textContent = data.viewers
		liveplayer.classList.remove('offline')
		document.body.classList.add('livestreamonline')
		API.start()
	} else {
		viewercount.textContent = '-'
		liveplayer.classList.add('offline')
		API.stop()
		document.body.classList.remove('livestreamonline')
	}
})

setInterval(function () {
	bitdashConf.source.poster = jwConfig.playlist[0].image = config.livestream_url_thumbnail+'?t='+Date.now()
	if (!player || !isOnline || !enabled) return
	if (playerType === 'bitdash') {
		if (!player.setPosterImage || player.isPlaying()) return
		player.setPosterImage(bitdashConf.source.poster)
	} else if (playerType === 'jw') {
		if (player.getState() === 'playing') return
		document.querySelector('.jw-preview').style.backgroundImage = 'url("'+jwConfig.playlist[0].image+'")'
	}
}, 10*1000)


const API = {
	enable() {
		enabled = true
		API.start()
	},
	disable() {
		enabled = false
		API.stop()
	},
	start() {
		if (playerType === 'bitdash') {
			startBitDashPlayer()
		} else if (playerType === 'jw') {
			startJwPlayer()
		}
	},
	stop() {
		if (!player) {
			return
		}
		if (playerType === 'bitdash') {
			if (player.pause) player.pause()
			//if (player.unload) player.unload()
			if (player.destroy) player.destroy()
		} else {
			player.stop()
			player.remove()
		}
		player = null
		socket.disconnect()
	}
}

if (window.autostartLivestream) {
	API.enable()
}

export default API
