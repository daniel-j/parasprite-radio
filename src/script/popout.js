import './incl/radioinfo'
import radioPlayer from './incl/radioplayer'

let radio = radioPlayer({
	url: 'http://icecast.djazz.se:8000/radio',
	autoplay: true
})


radio.activate()
