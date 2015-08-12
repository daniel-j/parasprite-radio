import xhr from '../utils/xhr'
import * as notify from '../utils/notify'

let nowtitle = document.getElementById('nowtitle')
let nowartist = document.getElementById('nowartist')
let cover = document.getElementById('cover')
let coverlink = document.getElementById('coverlink')
let listenercount = document.getElementById('listenercount')
let viewercount = document.getElementById('viewercount')
let liveplayer = document.getElementById('liveplayer')
let lastnowplaying = ''
window.nowplayingdata = ''
window.livestreamInfo = {online: false, viewers: -1}

cover.addEventListener('error', function () {
	cover.src = '/img/cover/pr-cover-tiny.png'
}, false)

function updateNowPlaying() {
	setTimeout(updateNowPlaying, 10*1000)
	//console.log("fetching now playing")
	xhr('/api/status', function (res) {
		let data
		try {
			data = JSON.parse(res)
		} catch (e) {
			console.log(res)
			data = {}
			return
		}

		if (data && data.info && data.info.online) { // Something is streaming
			let title = data.meta.title
			let artist = data.meta.artist || ''
			let album = data.meta.album || ''
			let albumartist = data.meta.albumartist || ''
			let url = data.meta.url || ''
			listenercount.textContent = data.info.listeners//+" listener"+(icedata.listeners === 1 ? '':'s');
			//radio.style.visibility = 'visible'
			if (lastnowplaying !== title+' - '+artist) {
				//nowplaying.innerHTML = title
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
				if (window.isPlaying) {
					document.title = window.nowplayingdata + ' - Parasprite Radio'
				}
				if (data.meta.art) {
					cover.src = data.meta.art
					coverlink.href = data.meta.art
					if (window.playing) {
						notify.show(title, artist, cover.src)
					}
				} else {
					setTimeout(() => {
						cover.src = '/api/now/art/tiny?t='+Date.now()
						coverlink.href = '/api/now/art/full'
						if (window.playing) {
							notify.show(title, artist, cover.src)
						}
					}, 2000)
				}
			}

		} else { // No stream
			//nowplaying.innerHTML = ''
			nowtitle.textContent = ''
			nowartist.textContent = ''
			listenercount.textContent = ''
			lastnowplaying = ''
			//nowplaying.href = ""
			//radio.style.visibility = 'hidden'
			window.nowplayingdata = ''
			document.title = 'Parasprite Radio'
		}

		window.livestreamInfo = data.livestream
		if (viewercount) {
			if (data && data.livestream && data.livestream.online) {
				viewercount.textContent = data.livestream.viewers
			} else {
				viewercount.textContent = ''
			}
		}
		if (liveplayer) {
			if (data && data.livestream && data.livestream.online) {
				liveplayer.classList.remove('offline')
			} else {
				liveplayer.classList.add('offline')
				if (window.liveplayer) {
					window.liveplayer.pause()
				}
			}
		}


	})
}

updateNowPlaying()
