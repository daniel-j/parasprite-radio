'use strict'

import './incl/radioinfo'
import radioPlayer from './incl/radioplayer'

const radio = radioPlayer({
  baseurl: window.config.general_streamurl,
  autoplay: true,
  mounts: window.config.icecast_mounts || []
})

radio.activate()
