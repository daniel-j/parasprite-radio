#!/usr/bin/env node
'use strict'

var config = require('../../scripts/config')

var keys = [
	'server.host',
	'server.port',

	'general.media_dir',

	'radio.title',
	'radio.description',
	'radio.url',
	'radio.genre',

	'icecast.host',
	'icecast.port',
	'icecast.encoding',
	'icecast.mount.user',
	'icecast.mount.password',

	'liquidsoap.port_telnet',
	'liquidsoap.port_harbor',
	'liquidsoap.port_input',

	'lastfm.username',
	'lastfm.password',

	'tunein.stationId',
	'tunein.partnerId',
	'tunein.partnerKey'
]

function getValue(k, o, i) {
	if (!i) i = 0
	var x = o[k[i]]
	if (typeof x === 'object' && x !== null) {
		o = getValue(k, x, i+1)
		return o
	}
	return x
}

var out = {}

for (var i = 0; i < keys.length; i++) {
	var k = keys[i].split('.')
	var v = getValue(k, config)
	if (v === undefined || v === null) v = ''
	out[String(keys[i])] = String(v)
}



console.log(JSON.stringify(out))
