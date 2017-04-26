#!/usr/bin/env node
'use strict'

const url = require('url')
const utils = require('./utils')

let arg = (process.argv[2] || '').trim()
let parsedUrl = url.parse(arg, true)

let handler = null

switch (parsedUrl.protocol) {
  default:
    switch (parsedUrl.hostname) {
      case 'm.soundcloud.com':
      case 'soundcloud.com':
        handler = require('./protocols/soundcloud')
        break

      case 'www.youtube.com':
      case 'youtube.com':
      case 'youtu.be':
      case 'm.youtube.com':
        handler = require('./protocols/youtube-dl')
        break

      case 'eqbeats.org':
        handler = require('./protocols/eqbeats')
        break

      case 'pony.fm':
        handler = require('./protocols/ponyfm')
        break

      case 'bronytunes.com':
        handler = require('./protocols/bronytunes')
        break
    }

    if (!handler) {
      if (/^.*bandcamp\.com$/.test(parsedUrl.hostname)) {
        handler = require('./protocols/bandcamp')
        break
      }
    }

    break
}

if (!handler) {
  console.error('No handler found, passing through...')
  console.log(arg)
} else {
  console.error('Using handler ' + handler.title)
  handler(arg, parsedUrl, handlerCallback)
}

function handlerCallback (o) {
  utils.formatter(o)
}
