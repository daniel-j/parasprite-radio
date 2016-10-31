'use strict'

import m from 'mithril'
import EventEmitter from 'events'

function create (uri, def, data) {
  const d = new EventEmitter()
  d.get = m.prop(def)
  d.fetch = function (override) {
    return m.request({
      url: window.config.server_api_prefix + uri,
      initialValue: def,
      data: override || data
    }).then(function (val) {
      d.get(val)
      d.emit('change', val)
    })
  }
  return d
}

function timer (d, time) {
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
  status: timer(create('/status'), 10 * 1000),
  user: create('/user'),
  history: timer(create('/history?limit=20&imagesize=1', []), 10 * 1000)
}

export default api
