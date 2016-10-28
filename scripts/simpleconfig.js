'use strict'

module.exports = function () {
  delete require.cache[require.resolve('./config')]
  const config = require('./config')
  function getValue (k, o, i) {
    if (!i) i = 0
    var x = o[k[i]]
    if (typeof x === 'object' && x !== null && !Array.isArray(x)) {
      return getValue(k, x, i + 1)
    } else {
      return x
    }
  }
  var keys = [
    'general.baseurl', 'general.streamurl', 'general.irc', 'general.twitter',
    'radio.title',
    'server.api_prefix',
    'icecast.mounts',
    'google.publicApiKey', 'google.calendarId',
    'livestream.url_thumbnail', 'livestream.url_rtmp', 'livestream.url_dash', 'livestream.url_hls'
  ]
  var out = {}

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    var k = key.split('.')
    var v = getValue(k, config)
    if (v === undefined || v === null) v = ''
    out[String(key).replace(/\./g, '_')] = v
  }

  return out
}
