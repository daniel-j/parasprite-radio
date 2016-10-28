'use strict'

import './incl/radioinfo'
import radioPlayer from './incl/radioplayer'

const radio = radioPlayer({
  baseurl: window.config.general_streamurl,
  autoplay: true
})

radio.activate()
