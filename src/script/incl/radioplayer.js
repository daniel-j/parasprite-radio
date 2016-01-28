'use strict'

import * as notify from '../utils/notify'
import './raf'
import ismobile from '../utils/ismobile'
//let EventEmitter = require('events').EventEmitter


let AudioContext = window.AudioContext || window.webkitAudioContext

function log10(num) {
	return Math.log(num) / Math.LN10
}

function radioPlayer(opts = {}) {

	let o = {} //Object.create(EventEmitter.prototype)

	let isPlaying = false
	window.playing = false

	let playstopbtn = document.getElementById('playstopbtn')
	let radioVolume = document.getElementById('radioVolume')
	let visualizerDiv = document.getElementById('visualizer')
	let streamSelect = document.getElementById('streamSelect')
	let streamLink = document.getElementById('streamLink')

	let useVisualizer = (AudioContext && !!visualizerDiv && !ismobile)
	let acx, canvas, ctx, gainNode, analyzer, liveFreqData

	let urls
	if (ismobile && navigator.userAgent.indexOf('iPhone') !== -1) {
		urls = [['radio_mobile', 'audio/aac'], ['radio_mobile_vorbis', 'application/ogg'], ['radio_normal', 'audio/mpeg'], ['radio', 'audio/mpeg']]
	} else if (ismobile) {
		urls = [['radio_mobile', 'audio/aacp'], ['radio_mobile_vorbis', 'application/ogg'], ['radio_normal', 'audio/mpeg'], ['radio', 'audio/mpeg']]
	} else {
		urls = [['radio', 'audio/mpeg'], /*['radio_opus', 'application/ogg; codecs=opus'],*/ ['radio_normal', 'audio/mpeg'], ['radio_mobile', 'audio/aacp'], ['radio_mobile_vorbis', 'application/ogg']]
	}

	let baseurl = opts.baseurl
	let streamName = ''

	let volume = opts.volume || 0.8

	let audioTag = null
	let source = null

	if (useVisualizer) {
		if (!AudioContext) {
			useVisualizer = false
		} else {
			initializeVisualizer()
		}
	}

	let handleStreamEnded = () => {
		setTimeout(() => {
			if (isPlaying) {
				startRadio()
			}
		}, 1000)
	}

	let handleStreamCanPlay = () => {
		if (isPlaying) {
			window.playing = true
			playstopbtn.textContent = 'Stop'
			playstopbtn.className = 'stop'
			if (useVisualizer) {
				visualizerDiv.style.display = 'block'
			}
		}
	}

	if (opts.autoplay) {
		startRadio()
	}

	playstopbtn.disabled = false


	function initializeVisualizer() {
		acx = new AudioContext()
		if (!acx.createGain || !acx.createMediaElementSource || !acx.createAnalyser) {
			useVisualizer = false
			return
		}

		canvas = document.createElement('canvas')
		ctx = canvas.getContext('2d')
		visualizerDiv.appendChild(canvas)

		gainNode = acx.createGain()
		gainNode.connect(acx.destination)

		analyzer = acx.createAnalyser()
		analyzer.fftSize = 2048
		analyzer.connect(gainNode)
		analyzer.smoothingTimeConstant = 0.5

		liveFreqData = new Float32Array(analyzer.frequencyBinCount)
	}

	function stopRadio() {
		isPlaying = false
		window.playing = false
		document.body.classList.remove('radioplaying')

		if (source) {
			source.disconnect(0)
			source = null
		}
		if (audioTag && audioTag !== true) {
			audioTag.removeEventListener('error', handleStreamEnded)
			audioTag.removeEventListener('ended', handleStreamEnded)
			audioTag.removeEventListener('canplay', handleStreamCanPlay)
			audioTag.pause()

			audioTag.src = ''
			while (audioTag.firstChild) {
				audioTag.removeChild(audioTag.firstChild)
			}
			audioTag.load()
			audioTag = null
		}
		playstopbtn.textContent = 'Play'
		playstopbtn.className = ''
		document.title = 'Parasprite Radio'
		if (useVisualizer) {
			visualizerDiv.style.display = 'none'
		}
	}

	function startRadio() {
		stopRadio()
		isPlaying = true
		document.body.classList.add('radioplaying')

		if (window.nowplayingdata) {
			document.title = window.nowplayingdata + ' - Parasprite Radio'
		}

		playstopbtn.textContent = 'Buffering'
		playstopbtn.className = 'loading'

		audioTag = new Audio()
		audioTag.addEventListener('error', handleStreamEnded, false)
		audioTag.addEventListener('ended', handleStreamEnded, false)
		audioTag.addEventListener('canplay', handleStreamCanPlay, false)
		audioTag.addEventListener('canplay', canPlayAudio, false)

		if (useVisualizer) {
			gainNode.gain.value = volume
			audioTag.volume = 0
		} else {
			audioTag.volume = volume
		}

		audioTag.crossOrigin = 'anonymous'
		if (streamName !== '') {
			let s = document.createElement('source')
			s.src = baseurl+streamName
			audioTag.appendChild(s)
		}
		for (let i = 0; i < urls.length; i++) {
			let s = document.createElement('source')
			s.src = baseurl+urls[i][0]
			s.type = urls[i][1]
			audioTag.appendChild(s)
		}
		audioTag.play()
		notify.check()

		function canPlayAudio(e) {
			audioTag.removeEventListener('canplay', canPlayAudio)
			streamName = audioTag.currentSrc.substr(baseurl.length)
			streamSelect.value = streamName
			streamLink.href = baseurl+streamName
			if (streamName.indexOf('radio') !== -1) {
				try {
					window.localStorage['pr:streamName'] = streamName
				} catch (e) {}
			}
			if (audioTag && useVisualizer) {
				audioTag.volume = 1
				source = acx.createMediaElementSource(audioTag)
				source.connect(analyzer)
				update()
			}
		}
	}

	function togglePlay() {
		if (isPlaying) {
			stopRadio()
		} else {
			startRadio()
		}
	}

	function setVolume(vol) {
		volume = vol
		if (useVisualizer) {
			gainNode.gain.value = volume
		} else if (audioTag) {
			audioTag.volume = volume
		}
	}

	function setStream(stream) {
		streamName = stream
		if (streamName === '') {
			streamLink.href = '/stream'
		} else {
			streamLink.href = baseurl+streamName
		}
		if (isPlaying) {
			startRadio()
		}
	}

	function update() {

		canvas.width = visualizerDiv.offsetWidth - 50
		canvas.height = visualizerDiv.offsetHeight

		ctx.clearRect(0, 0, canvas.width, canvas.height)

		if (!audioTag || !source) {
			//setTimeout(update, 1000)
			//requestAnimFrame(update)
			return
		}
		window.requestAnimFrame(update.bind(this), canvas)

		analyzer.getFloatFrequencyData(liveFreqData)

		let widthScale = canvas.width/2.5


		for (let i = 0; i < liveFreqData.length; i++) {
			//let freq = i*acx.sampleRate/analyzer.fftSize
			let x = log10((i+2)/2)*widthScale|0
			let dw = Math.ceil(log10((i+3)/2)*widthScale-log10((i+2)/2)*widthScale)

			let magnitude = Math.min(Math.max((liveFreqData[i]-analyzer.minDecibels)/95, 0), 1)

			//ctx.fillStyle = 'hsl('+Math.min(Math.floor((i/(liveFreqData.length*0.7))*360), 359)+', 100%, '+Math.floor(magnitude*100-10)+'%)'
			ctx.fillStyle = 'hsl('+(Math.floor((x/canvas.width)*20)+25)+', 100%, '+Math.max(magnitude*90+10, 20)+'%)'
			ctx.fillRect(x, canvas.height, dw, -magnitude*(canvas.height)|0)
			// PR hue: 38

		}
	}


	function activate() {

		playstopbtn.addEventListener('click', togglePlay.bind(this), false)

		let s
		try {
			s = window.localStorage['pr:streamName']
		} catch (e) {
			// Do nothing
		}
		if (typeof s !== 'undefined') {
			streamName = s
			streamSelect.value = streamName
			streamLink.href = baseurl+streamName
		}

		let v
		try {
			v = window.localStorage['pr:volume']
		} catch (e) {
			// Do nothing
		}
		if (typeof v !== 'undefined') {
			volume = +v
		}

		if (radioVolume) {
			radioVolume.addEventListener('input', () => {
				volume = +radioVolume.value
				setVolume(volume)
				try {
					window.localStorage['pr:volume'] = volume
				} catch (e) {}
			}, false)

			radioVolume.value = volume
		}

		setVolume(volume)

		streamSelect.addEventListener('change', () => {
			setStream(streamSelect.value)
		}, false)

	}

	o.startRadio = startRadio
	o.stopRadio = stopRadio
	o.togglePlay = togglePlay
	o.setVolume = setVolume
	o.activate = activate

	return Object.freeze(o)
}


export default radioPlayer
