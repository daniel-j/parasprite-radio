'use strict'

import * as notify from '../utils/notify'
import './raf'
import ismobile from '../utils/ismobile'
import Hls from 'hls.js'

let AudioContext = window.AudioContext || window.webkitAudioContext

function log10 (num) {
  return Math.log(num) / Math.LN10
}

function radioPlayer (opts = {}) {
  let o = {} // Object.create(EventEmitter.prototype)

  let isPlaying = false
  window.playing = false

  let playstopbtn = document.getElementById('playstopbtn')
  let radioVolume = document.getElementById('radioVolume')
  let visualizerDiv = document.getElementById('visualizer')
  let streamSelect = document.getElementById('streamSelect')
  let streamLink = document.getElementById('streamLink')
  let volumeButton = document.getElementById('volbutton')
  let volumeOverlay = document.getElementById('voloverlay')

  let useVisualizer = (AudioContext && !!visualizerDiv && !ismobile)
  let acx, canvas, ctx, gainNode, analyzer, liveFreqData

  let urls
  if ((ismobile && navigator.userAgent.includes('iPhone')) || navigator.userAgent.includes('iPad')) {
    urls = [['radio_hls', 'application/vnd.apple.mpegurl']]
  } else if (ismobile) {
    urls = [['radio_opus', 'application/ogg; codecs=opus'], ['radio_hls', 'application/vnd.apple.mpegurl']]
  } else {
    urls = [['radio_hls', 'application/vnd.apple.mpegurl'], ['radio_opus', 'application/ogg; codecs=opus']]
  }

  for (let i = 0; i < urls.length; i++) {
    if (!opts.mounts.includes(urls[i][0]) && urls[i][0] !== 'radio_hls') {
      urls.splice(i, 1)
      i--
    }
  }

  console.log(urls)

  let baseurl = opts.baseurl
  let streamName = ''

  let volume = opts.volume || 0.8

  let audioTag = null
  let source = null
  let hls = null

  let currentFragment = null

  window.delay = 0

  setInterval(() => {
    let frag = currentFragment
    window.delay = 0
    if (!frag || !audioTag) return
    window.delay = Date.now() - frag.programDateTime + frag.duration * 1000 - (audioTag.currentTime * 1000 - frag.start * 1000)
    // console.log('current frag', (Date.now()/1000 - window.lastMeta.start - window.serverTimeDiff/1000), delay)
  }, 50)

  if (useVisualizer) {
    if (!AudioContext) {
      useVisualizer = false
    } else {
      initializeVisualizer()
    }
  }

  let handleStreamEnded = () => {
    playstopbtn.textContent = 'Buffering'
    playstopbtn.className = 'loading'
    setTimeout(() => {
      if (isPlaying && !(ismobile || navigator.userAgent.includes('iPad'))) {
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

  if (opts.autoplay && !(ismobile || navigator.userAgent.includes('iPad'))) {
    startRadio()
  }

  playstopbtn.disabled = false

  function initializeVisualizer () {
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

  function stopRadio () {
    isPlaying = false
    window.playing = false
    document.body.classList.remove('radioplaying')

    if (hls) {
      hls.destroy()
      hls = null
      currentFragment = null
    }

    if (source) {
      source.disconnect(0)
      source = null
    }
    if (audioTag && audioTag !== true) {
      audioTag.removeEventListener('error', handleStreamEnded)
      audioTag.removeEventListener('ended', handleStreamEnded)
      audioTag.removeEventListener('stalled', handleStreamEnded)
      audioTag.removeEventListener('canplay', handleStreamCanPlay)
      audioTag.removeEventListener('pause', stopRadio)
      audioTag.pause()

      audioTag.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAVFYAAFRWAAABAAgAZGF0YQAAAAA='
      while (audioTag.firstChild) {
        audioTag.removeChild(audioTag.firstChild)
      }
      audioTag.load()
      audioTag = null
    }
    playstopbtn.textContent = 'Play'
    playstopbtn.className = ''
    document.title = window.config.radio_title
    if (useVisualizer) {
      visualizerDiv.style.display = 'none'
    }
  }

  function startRadio () {
    stopRadio()
    isPlaying = true
    document.body.classList.add('radioplaying')

    if (window.nowplayingdata) {
      document.title = window.nowplayingdata + ' - ' + window.config.radio_title
    }

    playstopbtn.textContent = 'Buffering'
    playstopbtn.className = 'loading'

    audioTag = new Audio()
    audioTag.addEventListener('error', handleStreamEnded, false)
    audioTag.addEventListener('ended', handleStreamEnded, false)
    audioTag.addEventListener('stalled', handleStreamEnded, false)
    audioTag.addEventListener('canplay', handleStreamCanPlay, false)
    audioTag.addEventListener('canplay', canPlayAudio, false)
    audioTag.addEventListener('pause', stopRadio, false)

    if (useVisualizer) {
      gainNode.gain.value = volume
      audioTag.volume = 0
    } else {
      audioTag.volume = volume
    }

    if (Hls.isSupported() && ((streamName === '' && (!ismobile || urls.length === 0)) || streamName === 'radio_hls')) {
      hls = new Hls()
      hls.attachMedia(audioTag)
      hls.loadSource('/streams/radio.m3u8')
      window.hls = hls
      window.audioTag = audioTag
      window.Hls = Hls
      hls.on(Hls.Events.FRAG_CHANGED, function (event, data) {
        currentFragment = data.frag
      })
    } else {
      audioTag.crossOrigin = 'anonymous'
      if (streamName !== '') {
        let s = document.createElement('source')
        if (streamName === 'radio_hls') {
          s.src = '/streams/radio.m3u8'
        } else {
          s.src = baseurl + streamName
        }
        audioTag.appendChild(s)
      }
      for (let i = 0; i < urls.length; i++) {
        let s = document.createElement('source')
        s.src = baseurl + urls[i][0]
        s.type = urls[i][1]
        audioTag.appendChild(s)
      }
    }

    audioTag.load()
    audioTag.play()
    // notify.check()

    function canPlayAudio (e) {
      if (!audioTag) return
      audioTag.removeEventListener('canplay', canPlayAudio)
      if (audioTag.currentSrc.startsWith('blob:') || audioTag.currentSrc.endsWith('.m3u8')) {
        streamName = 'radio_hls'
        streamLink.href = '/streams/radio.m3u8'
      } else {
        streamName = audioTag.currentSrc.substr(baseurl.length)
        streamLink.href = baseurl + streamName
      }
      streamSelect.value = streamName
      console.log(streamName)

      try {
        window.localStorage['pr:streamName'] = streamName
      } catch (e) {}
      if (audioTag && useVisualizer) {
        audioTag.volume = 1
        source = acx.createMediaElementSource(audioTag)
        source.connect(analyzer)
        update()
      }
    }
  }

  function togglePlay () {
    if (isPlaying) {
      stopRadio()
    } else {
      startRadio()
    }
  }

  function setVolume (vol) {
    volume = vol
    if (useVisualizer) {
      gainNode.gain.value = volume
    } else if (audioTag) {
      audioTag.volume = volume
    }
  }

  function setStream (stream) {
    streamName = stream
    if (streamName === '') {
      streamLink.href = 'javascript:'
    } else if (streamName === 'radio_hls') {
      streamLink.href = '/streams/radio.m3u8'
    } else {
      streamLink.href = baseurl + streamName
    }
    if (isPlaying) {
      if (ismobile || navigator.userAgent.includes('iPad')) {
        stopRadio()
      } else {
        startRadio()
      }
    }
  }

  function update () {
    canvas.width = visualizerDiv.offsetWidth - 50
    canvas.height = visualizerDiv.offsetHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!audioTag || !source) {
      // setTimeout(update, 1000)
      // requestAnimFrame(update)
      return
    }
    window.requestAnimFrame(update.bind(this), canvas)

    analyzer.getFloatFrequencyData(liveFreqData)

    let widthScale = canvas.width / 2.5

    for (let i = 0; i < liveFreqData.length; i++) {
      // let freq = i*acx.sampleRate/analyzer.fftSize
      let x = log10((i + 2) / 2) * widthScale | 0
      let dw = Math.ceil(log10((i + 3) / 2) * widthScale - log10((i + 2) / 2) * widthScale)

      let magnitude = Math.min(Math.max((liveFreqData[i] - analyzer.minDecibels) / 95, 0), 1)

      // ctx.fillStyle = 'hsl('+Math.min(Math.floor((i/(liveFreqData.length*0.7))*360), 359)+', 100%, '+Math.floor(magnitude*100-10)+'%)'
      ctx.fillStyle = 'hsl(' + (Math.floor((x / canvas.width) * 20) + 180) + ', 30%, ' + Math.max(magnitude * 90 + 10, 20) + '%)'
      ctx.fillRect(x, canvas.height, dw, -magnitude * canvas.height | 0)
      // PR hue: 38
    }
  }

  function activate () {
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
      if (streamName === 'radio_hls') {
        streamLink.href = '/streams/radio.m3u8'
      } else {
        streamLink.href = baseurl + streamName
      }
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

    if (volumeButton && volumeOverlay) {
      volumeButton.addEventListener('click', (e) => {
        volumeOverlay.classList.toggle('visible')
        e.preventDefault()
      }, false)
      window.addEventListener('mousedown', (e) => {
        let n = e.target
        while (n !== null) {
          if (n === volumeOverlay || n === volumeButton) {
            return
          }
          n = n.parentNode
        }
        volumeOverlay.classList.remove('visible')
      })
      window.addEventListener('blur', (e) => {
        // volumeOverlay.classList.remove('visible')
      }, false)
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
