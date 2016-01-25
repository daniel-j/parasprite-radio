'use strict'

import * as notify from '../utils/notify'
import api from '../entities/api'

import moment from 'moment'

let nowtitle = document.getElementById('nowtitle')
let nowartist = document.getElementById('nowartist')
let cover = document.getElementById('cover')
let listenercount = document.getElementById('listenercount')
let bigplayertime = document.getElementById('bigplayertime')
let bigplayerduration = document.getElementById('bigplayerduration')
let bigplayerprogress = document.querySelector('#bigplayerprogressbar div')
let bigcover = document.getElementById('bigcover')
let bigbackground = document.getElementById('bigbackground')
let lastnowplaying = ''
let isOnline = false
let lastMeta = null
let lastMetaTimestamp = 0
window.nowplayingdata = ''

cover.addEventListener('error', function () {
	cover.src = '/img/cover/cover-small.png'
}, false)


function updateMetadata(m) {
	if (isOnline && m && lastMeta !== m) {
		let title = m.title || ''
		let artist = m.artist || ''
		let album = m.album || ''
		let albumartist = m.albumartist || ''
		let url = m.url || ''
		if (url) {
			let a = document.createElement('a')
			a.href = url
			a.target = '_blank'
			a.textContent = title
			nowtitle.textContent = ''
			nowtitle.appendChild(a)
		} else {
			nowtitle.textContent = title
		}
		nowtitle.title = nowtitle.textContent
		nowartist.textContent = artist+(album?' ('+(albumartist&&artist!==albumartist&&album!==albumartist?albumartist+' - ':'')+album+')':'')
		nowartist.title = nowartist.textContent
		//nowplaying.href = "http://www.lastfm.se/search?q="+encodeURIComponent(title.replace(" - ", " "))
		lastnowplaying = title+' - '+artist

		if (bigplayerprogress) {
			updateProgress()
		}

		window.nowplayingdata = lastnowplaying
		if (window.playing) {
			document.title = window.nowplayingdata + ' - Parasprite Radio'
		}

		cover.src = '/api/now/art/tiny?t='+Date.now()
		if (bigcover && bigbackground) {
			bigcover.style.backgroundImage = bigbackground.style.backgroundImage = 'url("/api/now/art/original?t='+Date.now()+'")'
		}
		if (window.playing) {
			notify.show(title, artist, cover.src)
		}
	} else { // No stream
		//nowplaying.innerHTML = ''
		nowtitle.textContent = ''
		nowartist.textContent = ''
		lastnowplaying = ''
		//nowplaying.href = ""
		//radio.style.visibility = 'hidden'
		window.nowplayingdata = ''
		document.title = 'Parasprite Radio'
	}
	if (m) {
		lastMeta = m
	}
}

function updateProgress() {
	let m = lastMeta
	if (m && m.duration) {
		let duration = m.duration*1000
		let time = Math.min(duration, Math.max(0, Date.now()-m.on_air-window.serverTimeDiff))
		bigplayerprogress.style.width = (time/duration)*100+'%'
		bigplayertime.textContent = moment(time).format('m:ss')
		bigplayerduration.textContent = moment(duration).format('m:ss')
	} else {
		bigplayertime.textContent = ''
		bigplayerduration.textContent = ''
		bigplayerprogress.style.width = 0
	}
}

if (bigplayerprogress) {
	setInterval(updateProgress, 100)
}

api.events.on('metadata', updateMetadata)

api.events.on('icecaststatus', function (info) {
	isOnline = info.online
	updateMetadata(lastMeta)
})

api.events.on('listenercount', function (count) {
	listenercount.textContent = count
})
