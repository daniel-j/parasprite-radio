'use strict'

import xhr from './utils/xhr'
import './incl/radioinfo'
import radioPlayer from './incl/radioplayer'
import livestream from './livestream'

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
	xhr('/api/history?limit=20&imagesize=1', function (res) {
		let tracks
		try {
			tracks = JSON.parse(res)
		} catch (e) {
			console.log(res)
			tracks = []
		}

		while (playhistory.childNodes.length > 0) {
			playhistory.removeChild(playhistory.firstChild)
		}

		for (let i = 0; i < tracks.length; i++) {
			let track = tracks[i]


			let row = playhistory.insertRow(-1)
			row.dataset.url = track.url

			let imgcell = row.insertCell(-1)
			let titlecell = row.insertCell(-1)
			let artistcell = row.insertCell(-1)
			//let albumcell = row.insertCell(-1)
			let datecell = row.insertCell(-1)
			datecell.className = 'date'

			let img = new Image()
			img.src = track.art
			imgcell.appendChild(img)

			titlecell.textContent = track.title
			artistcell.textContent = track.artist
			//albumcell.textContent = track.album['#text']
			//console.log(track)

			datecell.textContent = timeago(Date.now()/1000 - track.timestamp, true)
			datecell.title = new Date(track.timestamp*1000)
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

setInterval(updateHistory, 10*1000)
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
// reload every 5 min
setInterval(function () {
	scheduleiframe.src += ''
}, 5*60*1000)


// Map
let geocanvas = document.getElementById('geocanvas')
let geoctx = geocanvas.getContext('2d')
function updateMap() {
	xhr('/api/listeners', function (res) {
		let list = []
		try {
			list = JSON.parse(res)
		} catch (e) {

		}
		geoctx.clearRect(0, 0, geocanvas.width, geocanvas.height)
		for (let i = 0; i < list.length; i++) {
			let x = list[i].x
			let y = list[i].y
			geoctx.fillStyle = 'white'
			geoctx.fillRect(x-4, y-4, 8, 8)
			geoctx.fillStyle = 'orange'
			geoctx.fillRect(x-3, y-3, 6, 6)
		}
	})
}



// Account
xhr('/api/user', function (res) {
	let user = {}
	try {
		user = JSON.parse(res)
	} catch (e) {
		return
	}
	if (user.loggedin) {
		document.getElementById('body').classList.add('loggedin')
		document.getElementById('accountUsername').textContent = user.username
		document.getElementById('accountDisplayName').textContent = user.displayName
		document.getElementById('accountEmail').textContent = user.email
		document.getElementById('accountAvatar').src = user.avatarUrl

		if (user.level >= 5) {
			document.getElementById('body').classList.add('isadmin')

			setInterval(updateMap, 5*1000)
			updateMap()
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

		} else {
			livestream.stop()
		}
	}
}, false)

let hashMatch = document.querySelector('[data-hash="'+document.location.hash.substr(1)+'"]')
if (hashMatch) {
	document.location.hash = ''
	if (history) {
		history.replaceState('', document.title, window.location.pathname)
	}
	hashMatch.click()
}
