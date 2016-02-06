'use strict'

import * as notify from '../utils/notify'
import events from '../entities/events'

import dateFormat from 'dateformat-light'
import linker from '../utils/linker'

let nowtitle = document.getElementById('nowtitle')
let nowartist = document.getElementById('nowartist')
let cover = document.getElementById('cover')
let listenercount = document.getElementById('listenercount')
let bigplayertime = document.getElementById('bigplayertime')
let bigplayerduration = document.getElementById('bigplayerduration')
let bigplayerprogress = document.querySelector('#bigplayerprogressbar div')
let bigcover = document.getElementById('bigcover')
let bigbackground = document.getElementById('bigbackground')
let bigplayerformat = document.getElementById('bigplayerformat')
let bigplayerinfo = document.getElementById('bigplayerinfo')
let bigplayercomment = document.getElementById('bigplayercomment')
let bigplayertitle = document.getElementById('bigplayertitle')
let bigplayerartist = document.getElementById('bigplayerartist')
let bigplayeralbum = document.getElementById('bigplayeralbum')
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
			bigplayertitle.textContent = title
			bigplayerartist.textContent = artist
			if (albumartist && artist!==albumartist && album!==albumartist && albumartist.length < 25) {
				bigplayeralbum.textContent = albumartist+' - '+album
			} else {
				bigplayeralbum.textContent = album
			}

			updateProgress()
			if (m.duration > 10) {
				bigplayerformat.textContent = m.ext.toUpperCase()+' '+m.bitrate+' kbps'+(m.bitrate_mode==='variable'?' VBR':'')
				bigplayercomment.textContent = ((m.url|| '')+'\n'+(m.comment|| '')).trim()
				bigplayercomment.innerHTML = linker(bigplayercomment.innerHTML).replace(/\n/g, '<br/>')
				bigplayerinfo.style.opacity = 1
			} else {
				bigplayercomment.textContent = ''
				bigplayerinfo.style.opacity = 0
			}
		}

		window.nowplayingdata = lastnowplaying
		if (window.playing) {
			document.title = window.nowplayingdata + ' - Parasprite Radio'
		}

		cover.src = '/api/now/art/tiny?t='+Date.now()
		if (bigcover && bigbackground) {
			bigcover.style.backgroundImage = bigbackground.style.backgroundImage = 'url("/api/now/art/original?t='+Date.now()+'")'
			bigcover.style.backgroundImage = bigbackground.style.backgroundImage = 'url("/api/now/art/original?t='+Date.now()+'"), url("/api/now/art/small?t='+Date.now()+'"), url("/api/now/art/tiny?t='+Date.now()+'")'
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
	if (m && m.duration > 10) { // at least 10 seconds long
		let duration = m.duration*1000
		let time = Math.min(duration, Math.max(0, Date.now()-m.on_air-window.serverTimeDiff-2000))
		bigplayerprogress.style.width = (time/duration)*100+'%'
		bigplayertime.textContent = dateFormat(new Date(time), 'M:ss')
		bigplayerduration.textContent = dateFormat(new Date(duration), 'M:ss')
	}
}

if (bigplayerprogress) {
	setInterval(updateProgress, 100)
}

events.on('metadata', updateMetadata)

events.on('icecaststatus', function (info) {
	isOnline = info.online
	updateMetadata(lastMeta)
})

events.on('listenercount', function (count) {
	listenercount.textContent = count
})
