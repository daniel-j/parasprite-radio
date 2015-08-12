/* global bitdash */

import xhr from './utils/xhr'
import './incl/radioinfo'
import radioPlayer from './incl/radioplayer'

let radio = radioPlayer({
	url: 'http://icecast.djazz.se:8000/radio',
	autoplay: false
})

radio.activate()

document.getElementById('popuplink').addEventListener('click', function (e) {
	e.preventDefault()
	radio.stopRadio()
	window.open('/popout', 'parasprite-radio-popout', 'width=450,height=240,left=300,top=100')
	return false
}, false)

let menudiv = document.getElementById('mainmenu')
let scheduleiframe = document.getElementById('scheduleiframe')

let currentPage = 'pageHistory'
let oldmenu = document.getElementById('menuHistory')



// History
let playhistory = document.getElementById('playhistory')

function timeago(timems) {
	let time = timems|0
	//let ms = ''
	let val, name
	if (time < 60) {val = time; name = 'second'}
	else if (time < 3600) {val = Math.round(time / 60); name = 'minute'}
	else if (time < 86400) {val = Math.round(time / 3600); name = 'hour'}
	else {val = Math.round(time / 86400); name = 'day'}
	return val+' '+name+(val === 1 ? '':'s')+' ago'
}

function updateHistory() {
	xhr('/api/lastfm/recent', function (res) {
		setTimeout(updateHistory, 10*1000)
		let data, tracks
		try {
			data = JSON.parse(res)
			tracks = data.recenttracks.track
		} catch (e) {
			console.log(res)
			data = {}
			tracks = []
			return
		}

		while (playhistory.childNodes.length > 0) {
			playhistory.removeChild(playhistory.firstChild)
		}
		let isnowplaying = false

		for (let i = 0; i < tracks.length; i++) {
			let track = tracks[i]
			let attr = track['@attr'] || {}

			if (attr.nowplaying) {
				//nowplaying.href = track.url
				//lastfmurl = track.url
				//isnowplaying = true
				continue
			}


			let row = playhistory.insertRow(-1)
			row.dataset.url = track.url

			if (attr.nowplaying) {
				row.className = 'nowplaying'
			}

			let imgcell = row.insertCell(-1)
			let titlecell = row.insertCell(-1)
			let artistcell = row.insertCell(-1)
			//let albumcell = row.insertCell(-1)
			let datecell = row.insertCell(-1)
			datecell.className = 'date'

			if (track.image[2]['#text']) {
				let img = new Image()
				img.src = track.image[2]['#text']
				imgcell.appendChild(img)
			} else if (track.artist.image[2]['#text']) {
				let img = new Image()
				img.src = track.artist.image[2]['#text']
				imgcell.appendChild(img)
			}

			titlecell.textContent = track.name
			artistcell.textContent = track.artist.name
			//albumcell.textContent = track.album['#text']
			//console.log(track)
			if (track.date) {
				datecell.textContent = timeago(Date.now()/1000 - track.date.uts, true)
				datecell.title = new Date(track.date.uts*1000)
			} else if (attr.nowplaying) {
				datecell.textContent = 'now'
			}
		}
		if (!isnowplaying) {
			//lastfmurl = ''
		}
	})
}

playhistory.addEventListener('click', function (e) {
	let node = e.target
	while (node.parentNode !== playhistory) {
		node = node.parentNode
	}
	window.open(node.dataset.url, '_blank')
}, false)

updateHistory()



// Playlist
let playlist = document.getElementById('playlist')
let playlisthours = document.getElementById('playlisthours')
let playlistcount = document.getElementById('playlistcount')
let rawlist = null

function updatePlaylist() {
	xhr('playlist.json?timestamp='+Date.now(), function (res) {

		let data

		try {
			data = JSON.parse(res)
		} catch (e) {
			console.log(res)
			data = {}
			return
		}

		rawlist = data

		while (playlist.childNodes.length > 0) {
			playlist.removeChild(playlist.firstChild)
		}
		let totaltime = 0
		for (let i = 0; i < data.length; i++) {
			let track = data[i]
			totaltime += +track.time


			let row = playlist.insertRow(-1)
			row.dataset.url = 'http://www.last.fm/search?q='+encodeURIComponent(track.title+' '+track.artist)

			let titlecell = row.insertCell(-1)
			let artistcell = row.insertCell(-1)
			//let albumcell = row.insertCell(-1)

			titlecell.textContent = track.title
			artistcell.textContent = track.artist
			//albumcell.textContent = track.album

		}
		playlisthours.textContent = Math.round(totaltime/(60*60))
		playlistcount.textContent = data.length
	})
}

playlist.addEventListener('click', function (e) {
	let node = e.target
	while (node.parentNode !== playlist) {
		node = node.parentNode
	}
	window.open(node.dataset.url, '_blank')
}, false)

function encode(s) {
	return encodeURIComponent(s||'').replace(/\%20/g, '+')
}

function toSpotifyPlaylist() {
	let list = []
	for (let i = 0; i < rawlist.length; i++) {
		let track = rawlist[i]
		list.push('spotify:local:'+encode(track.artist)+':'+encode(track.album)+':'+encode(track.title)+':'+track.time)
	}
	console.log(list.join('\n'))
}

window.toSpotifyPlaylist = toSpotifyPlaylist

// Schedule
let tz = window.jstz.determine()
let timezone = tz.name()

let bgcolor = '444444'
let color = '8C500B'

scheduleiframe.src = 'https://www.google.com/calendar/embed?mode=WEEK&showTitle=0&showCalendars=0&height=350&wkst=2&bgcolor=%23'+bgcolor+'&src=nj4dn0ck0u66t6f38qtqnj324k%40group.calendar.google.com&color=%23'+color+'&ctz='+encodeURIComponent(timezone)

// Livestream
let conf = {
	key: '0fa2b26cbe5994c6752baa89519ed7aa',
	source: {
		mpd: 'http://vm.djazz.se/dash/stream.mpd',
		hls: 'http://vm.djazz.se/hls/stream.m3u8',
		poster: '/img/night_by_gign.png'
	},
	style: {
		width: '100%',
		aspectratio: '16:9',
		controls: true
	},
	playback: {
		autoplay: false
	}
}
let player = null


function initBitdash() {
	player = bitdash('dashplayer')
	window.liveplayer = player
	player.setup(conf)

	player.addEventHandler('onReady', function () {
		console.log('ready!')
		// ugly fix but needed
		var video = document.getElementById('bitdash-video-dashplayer')
		if (video) {
			video.poster = conf.source.poster
		}
	})
}

// Account
xhr('/api/user', function (res) {
	var user
	try {
		user = JSON.parse(res)
	} catch (e) {
		user = {}
		return
	}
	if (user.loggedin) {
		document.getElementById('body').classList.add('loggedin')
		document.getElementById('accountUsername').textContent = user.username
		document.getElementById('accountDisplayName').textContent = user.displayName

		if (user.level >= 5) {
			document.getElementById('body').classList.add('isadmin')
		}
	}
})

menudiv.addEventListener('click', function (e) {
	let newmenu = e.target
	if (!newmenu.dataset.page && !newmenu.dataset.url) {
		return
	}
	if (newmenu.dataset.url) {
		window.open(newmenu.dataset.url, '_blank')
	} else {

		oldmenu.className = ''
		newmenu.className = 'current'
		oldmenu = newmenu
		document.getElementById(currentPage).style.display = 'none'
		currentPage = newmenu.dataset.page
		document.getElementById(currentPage).style.display = 'block'

		if (currentPage === 'pagePlaylist') {
			updatePlaylist()
		}
		if (currentPage === 'pageLivestream') {
			if (!player) {
				initBitdash()
			} else {
				player.load(conf.source)
			}

		} else {
			if (player) {
				player.unload()
			}
		}
	}
}, false)

