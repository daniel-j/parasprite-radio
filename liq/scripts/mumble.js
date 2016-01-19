#!/usr/bin/env node
'use strict'

var fs = require('fs')
var mumble = require('mumble')
var config = require(__dirname+'/../../scripts/config')

var options = {
	// not needed for now
	// key: fs.readFileSync( 'mumble-key.pem' ),
	// cert: fs.readFileSync( 'mumble-cert.pem' )
}

mumble.connect(config.mumble.uri, options, function ( error, connection ) {
	if (error) {
		throw new Error( error )
	}

	connection.authenticate(config.mumble.botname)
	connection.on('initialized', function () {
		process.stdin.pipe(connection.inputStream({gain: 0.6, channels: 1}))
	})
})

