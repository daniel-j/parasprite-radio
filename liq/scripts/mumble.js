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
var botname = config.mumble.botname

mumble.connect(config.mumble.uri, options, function ( error, connection ) {
	if (error) {
		throw new Error( error )
	}

	var inputStream = connection.inputStream({gain: 0.5, channels: 1})
	inputStream.on('error', function (e) {
		console.log('ERROR!!', e)
	})

	connection.authenticate(botname)
	connection.on('initialized', function () {
		process.stdin.pipe(inputStream)
	})

	connection.on('user-disconnect', function (user) {
		if (user.name === botname) {
			inputStream.close()
			connection.disconnect()
			process.stdin.end()
			process.exit()
		}
	})

})
