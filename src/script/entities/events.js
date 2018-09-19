'use strict'

import EventEmitter from 'events'
import EventSource from 'event-source'

const events = new EventEmitter()
window.serverTimeDiff = 0

let es = null
let esTimer = null

function esConnect () {
  if (es) {
    return
  }
  console.log('sse connect')
  clearTimeout(esTimer)
  es = new EventSource(window.config.server_api_prefix + '/sse')
  es.onerror = esError
  es.onopen = esOpen
  es.onmessage = esMessage
  esTimer = setTimeout(esError, 10 * 1000)
}
function esOpen () {
  console.log('sse open')
  clearTimeout(esTimer)
  esTimer = setTimeout(esError, 20 * 1000)
}
function esMessage (e) {
  let json = JSON.parse(e.data)
  let ev = json.e
  let data = json.d
  // console.log('sse msg', ev, data)
  if (ev !== 'ka' && ev !== 'timestamp') {
    console.log('Event:', ev, data)
  }
  if (ev === 'timestamp') {
    window.serverTimeDiff = Date.now() - data
  }
  events.emit(ev, data)
  clearTimeout(esTimer)
  esTimer = setTimeout(esError, 20 * 1000)
}
function esError () {
  if (!es) {
    return
  }
  console.log('sse error')
  clearTimeout(esTimer)
  es.close()
  es = null

  setTimeout(esConnect, 3 * 1000)
}
events.activate = esConnect

setTimeout(events.activate, 0)

export default events
