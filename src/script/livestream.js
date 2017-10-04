'use strict'

import events from './entities/events'
import Hls from 'hls.js'

let viewercount = document.getElementById('viewercount')
let liveplayer = document.getElementById('liveplayer')

let player = null
let playerId = 'livevideoplayer'
let playerType = 'html5'
let isOnline = false
let enabled = false
// let bufferTimer

/*
let bitdashConf = {
  key: '3c1f43e7-c788-4f4a-a13c-ab3569f63bc0',
  source: {
    dash: window.config.livestream_url_dash,
    hls: window.config.livestream_url_hls,
    poster: window.config.livestream_url_thumbnail + '?t=' + Date.now()
  },
  style: {
    height: '100%',
    width: '100%'
  },
  cast: {
    enable: true
  },

  logs: {
    bitmovin: false
  },
  tweaks: {
    // search_real_end: true
  },

  playback: {
    autoplay: true
  },

  events: {
    onPlay: function () {
      console.log('PLAY')
    },
    onPause: function () {
      console.log('PAUSE')
    },
    onSourceUnloaded: function () {
      console.log('UNLOADED')
    },
    onStartBuffering: function () {
      console.log('STALLED')
      clearTimeout(bufferTimer)
      bufferTimer = setTimeout(function () {
        if (!player || player.getTotalStalledTime() < 15) {
          return
        }
        API.stop()
        API.start()
      }, 15 * 1000)
    },
    onStopBuffering: function () {
      console.log('UNSTALLED')
      clearTimeout(bufferTimer)
    }
  }
}

let jwConfig = {
  playlist: [
    {
      image: window.config.livestream_url_thumbnail + '?t=' + Date.now(),
      sources: [
        { file: window.config.livestream_url_dash, label: 'DASH', type: 'application/dash+xml' },
        { file: window.config.livestream_url_hls, label: 'HLS', type: 'application/vnd.apple.mpegurl' },
        { file: window.config.livestream_url_rtmp, image: 'RTMP Flash', type: 'application/x-fcs' }
      ]
    }
  ],
  height: '100%',
  width: '100%',
  // autostart: true,
  primary: 'html5'
}

function startJwPlayer () {
  if (player || !isOnline || !enabled) {
    return
  }
  playerType = 'jw'

  try {
    jwConfig.mute = localStorage['jwplayer.mute']
  } catch (e) {}

  player = window.jwplayer(playerId)
  window.player = player
  player.setup(jwConfig)
  player.on('ready', function () {
    player.play()
  })
  player.on('play', function () {
    // we don't want viewers with flash to be counted twice
    if (player.getProvider().indexOf('rtmp') !== -1) {
      return
    }
  })
  player.on('pause', function () {
  })
  player.on('buffer', function () {

  })
}

function startBitDashPlayer () {
  if (player || !isOnline || !enabled) {
    return
  }
  playerType = 'bitdash'

  player = window.bitdash(playerId)
  window.player = player

  console.log('START PLAYER')
  bitdashConf.source.poster = window.config.livestream_url_thumbnail + '?t=' + Date.now()

  player.setup(bitdashConf).then(function () {
    // Success
    console.log('Successfully created bitdash player instance')
  }, function (reason) {
    // Error!
    console.log('Error while creating bitdash player instance', reason)
    // startJwPlayer()
    player = null
    setTimeout(startBitDashPlayer, 5000)
  })
}
*/

function startHtml5Player () {
  if (player || !isOnline || !enabled) {
    return
  }
  playerType = 'html5'
  let video = document.createElement('video')
  video.id = 'html5player'
  video.controls = true
  video.setAttribute('poster', '/streams/livestream.jpg')
  player = {video: video, hls: null}
  window.player = player
  document.getElementById(playerId).appendChild(video)

  if (Hls.isSupported()) {
    player.hls = new Hls()
    player.hls.attachMedia(video)
    player.hls.loadSource('/streams/livestream.m3u8')
  } else {
    video.src = '/streams/livestream.m3u8'
  }
  video.play()
}

events.on('livestreamstatus', function (data) {
  isOnline = data.online
  if (data.online) {
    viewercount.textContent = data.viewers
    liveplayer.classList.remove('offline')
    document.body.classList.add('livestreamonline')
    API.start()
  } else {
    viewercount.textContent = '-'
    liveplayer.classList.add('offline')
    API.stop()
    document.body.classList.remove('livestreamonline')
  }
})
/*
setInterval(function () {
  bitdashConf.source.poster = jwConfig.playlist[0].image = window.config.livestream_url_thumbnail + '?t=' + Date.now()
  if (!player || !isOnline || !enabled) return
  if (playerType === 'bitdash') {
    if (!player.setPosterImage || player.isPlaying()) return
    player.setPosterImage(bitdashConf.source.poster)
  } else if (playerType === 'jw') {
    if (player.getState() === 'playing') return
    document.querySelector('.jw-preview').style.backgroundImage = 'url("' + jwConfig.playlist[0].image + '")'
  }
}, 10 * 1000)
*/

const API = {
  enable () {
    enabled = true
    API.start()
  },
  disable () {
    enabled = false
    API.stop()
  },
  start () {
    if (playerType === 'bitdash') {
      // startBitDashPlayer()
    } else if (playerType === 'jw') {
      // startJwPlayer()
    } else if (playerType === 'html5') {
      startHtml5Player()
    }
  },
  stop () {
    if (!player) {
      return
    }
    if (playerType === 'bitdash') {
      if (player.pause) player.pause()
      // if (player.unload) player.unload()
      if (player.destroy) player.destroy()
    } else if (playerType === 'html5') {
      if (player.hls) {
        player.hls.destroy()
      }
      player.video.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAVFYAAFRWAAABAAgAZGF0YQAAAAA='
      player.video.load()
      player.video.parentNode.removeChild(player.video)
    } else {
      player.stop()
      player.remove()
    }
    player = null
  }
}

if (window.autostartLivestream) {
  API.enable()
}

export default API
