import xhr from '../utils/xhr'
import * as notify from '../utils/notify'

let nowtitle = document.getElementById('nowtitle')
let nowartist = document.getElementById('nowartist')
let cover = document.getElementById('cover')
let listenercount = document.getElementById('listenercount')
let lastnowplaying = ''
window.nowplayingdata = ''

cover.addEventListener('error', function () {
	cover.src = '/img/cover/cover-small.png'
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
				if (window.playing) {
					document.title = window.nowplayingdata + ' - Parasprite Radio'
				}

				// wait a bit for image to render
				setTimeout(() => {
					cover.src = '/api/now/art/tiny?t='+Date.now()
					if (window.playing) {
						notify.show(title, artist, cover.src)
					}
				}, 1000)
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
	})
}

updateNowPlaying()
