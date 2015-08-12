
import * as notify from '../utils/notify'
import './raf'
//let EventEmitter = require('events').EventEmitter


let AudioContext = window.AudioContext || window.webkitAudioContext


function radioPlayer(opts = {}) {

	let o = {} //Object.create(EventEmitter.prototype)

	let isPlaying = false
	window.playing = false

	let playstopbtn = document.getElementById('playstopbtn')
	let radioVolume = document.getElementById('radioVolume')
	let visualizerDiv = document.getElementById('visualizer')

	let useVisualizer = (AudioContext && !!visualizerDiv)
	let acx, canvas, ctx, gainNode, analyzer, liveFreqData

	let url = opts.url

	let volume = opts.volume || 0.8

	let audioTag = null
	let source = null
	let updatetick = 0
	let segmentcount = 16

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
		if (!acx.createGain) {
			useVisualizer = false
			return
		}

		canvas = document.createElement('canvas')
		canvas.width = visualizerDiv.offsetWidth
		canvas.height = visualizerDiv.offsetHeight
		ctx = canvas.getContext('2d')
		visualizerDiv.appendChild(canvas)

		gainNode = acx.createGain()
		gainNode.connect(acx.destination)

		analyzer = acx.createAnalyser()
		analyzer.fftSize = 32
		analyzer.connect(gainNode)
		analyzer.smoothingTimeConstant = 0.45

		liveFreqData = new Float32Array(analyzer.frequencyBinCount)
	}

	function stopRadio() {
		isPlaying = false
		window.playing = false

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
			audioTag.load()
			audioTag = null
		}
		playstopbtn.textContent = 'Play'
		playstopbtn.className = ''
		if (useVisualizer) {
			visualizerDiv.style.display = 'none'
		}
	}

	function startRadio() {
		stopRadio()
		isPlaying = true

		if (window.nowplayingdata) {
			document.title = window.nowplayingdata + ' - Parasprite Radio'
		}

		playstopbtn.textContent = 'Buffering'
		playstopbtn.className = 'loading'

		audioTag = new Audio()
		audioTag.addEventListener('error', handleStreamEnded, false)
		audioTag.addEventListener('ended', handleStreamEnded, false)
		audioTag.addEventListener('canplay', handleStreamCanPlay, false)

		if (useVisualizer) {
			gainNode.gain.value = volume
		} else {
			audioTag.volume = volume
		}

		audioTag.crossOrigin = 'anonymous'
		audioTag.src = url
		audioTag.play()
		notify.check()

		if (useVisualizer) {
			setTimeout(() => {
				if (audioTag) {
					source = acx.createMediaElementSource(audioTag)
					source.connect(analyzer)
					update()
				}
			}, 500)
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

	function update() {

		updatetick++

		if (updatetick % 2 === 1) {
			//window.requestAnimFrame(update)
			//return
		}


		ctx.clearRect(0, 0, canvas.width, canvas.height)

		if (!audioTag || !source) {
			//setTimeout(update, 1000)
			//requestAnimFrame(update)
			return
		}


		analyzer.getFloatFrequencyData(liveFreqData)

		let i

		let segments = []
		for (i = 0; i < segmentcount; i++) {
			segments[i] = 0
		}

		let samplesPerSegment = liveFreqData.length/segments.length

		for (i = 0; i < liveFreqData.length; i++) {
			//let freq = i*acx.sampleRate/analyzer.fftSize

			let magnitude = Math.min(Math.max((liveFreqData[i]-analyzer.minDecibels)/90, 0), 1)

			segments[i / samplesPerSegment|0] += magnitude
		}

		for (i = 0; i < segments.length; i++) {
			segments[i] = (segments[i] / samplesPerSegment)
			//let style = visualizerDiv.childNodes[i].style;
			//style.height = segments[i]+"%";
			ctx.fillStyle = 'hsl(38, 100%, '+(segments[i]*50+59/2)+'%)'
			ctx.fillRect((canvas.width/segments.length)*i|0, canvas.height, Math.ceil(canvas.width/segments.length), -segments[i]*canvas.height|0)
		}

		window.requestAnimFrame(update.bind(this), canvas)
	}


	function activate() {

		playstopbtn.addEventListener('click', togglePlay.bind(this), false)

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

	}

	o.startRadio = startRadio
	o.stopRadio = stopRadio
	o.togglePlay = togglePlay
	o.setVolume = setVolume
	o.activate = activate

	return Object.freeze(o)
}


export default radioPlayer
