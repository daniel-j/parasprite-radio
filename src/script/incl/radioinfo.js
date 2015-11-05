'use strict'

import * as notify from '../utils/notify'
import api from '../entities/api'

let nowtitle = document.getElementById('nowtitle')
let nowartist = document.getElementById('nowartist')
let cover = document.getElementById('cover')
let listenercount = document.getElementById('listenercount')
let lastnowplaying = ''
let isOnline = false
let lastMeta = null
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

		window.nowplayingdata = lastnowplaying
		if (window.playing) {
			document.title = window.nowplayingdata + ' - Parasprite Radio'
		}

		cover.src = '/api/now/art/tiny?t='+Date.now()
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


api.events.on('metadata', updateMetadata)

api.events.on('icecaststatus', function (info) {
	isOnline = info.online
	updateMetadata(lastMeta)
})

api.events.on('listenercount', function (count) {
	listenercount.textContent = count
})

