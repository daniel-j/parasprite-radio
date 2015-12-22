'use strict'

import { EventEmitter } from 'events'
import EventSource from 'event-source'

console.log('api --->')

function create(uri, def, data) {
	const d = new EventEmitter
	d.get = m.prop(def)
	d.fetch = function (override) {
		return m.request({
			url: config.server_api_prefix+uri,
			initialValue: def,
			data: override || data
		}).then(function (val) {
			d.get(val)
			d.emit('change', val)
		})
	}
	return d
}
function timer(d, time) {
	let _timer = null
	d.startTimer = function () {
		if (_timer === null) {
			_timer = setInterval(d.fetch, time)
			d.fetch()
		}
	}
	d.stopTimer = function () {
		clearInterval(_timer)
		_timer = null
	}
	return d
}


const api = {
	status: timer(create('/status'), 10*1000),
	user: create('/user'),
	history: timer(create('/history?limit=20&imagesize=1', []), 10*1000)
}

const events = new EventEmitter

let es = null // Evening Star, is that you?
let esTimer = null

function esConnect() {
	if (es) {
		return
	}
	console.log('sse connect')
	clearTimeout(esTimer)
	es = new EventSource(config.server_api_prefix+'/sse')
	es.onerror = esError
	es.onopen = esOpen
	es.onmessage = esMessage
	esTimer = setTimeout(esError, 10*1000)
}
function esOpen() {
	console.log('sse open')
	clearTimeout(esTimer)
	esTimer = setTimeout(esError, 20*1000)
}
function esMessage(e) {
	let json = JSON.parse(e.data)
	let ev = json.e
	let data = json.d
	//console.log('sse msg', ev, data)
	if (ev !== 'ka') {
		console.log('Event:', ev, data)
	}
	events.emit(ev, data)
	clearTimeout(esTimer)
	esTimer = setTimeout(esError, 20*1000)
}
function esError() {
	if (!es) {
		return
	}
	console.log('sse error')
	clearTimeout(esTimer)
	es.close()
	es = null

	setTimeout(esConnect, 5*1000)
}
events.activate = esConnect

//window.addEventListener('load', events.activate, false)
setTimeout(events.activate, 0)

api.events = events

export default api
