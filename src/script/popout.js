'use strict'

import './incl/radioinfo'
import radioPlayer from './incl/radioplayer'

let radio = radioPlayer({
	baseurl: config.general_streamurl,
	autoplay: true
})

radio.activate()
