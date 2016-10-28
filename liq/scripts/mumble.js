#!/usr/bin/env node
'use strict'

const mumble = require('mumble')
const path = require('path')
const config = require(path(__dirname, '../../scripts/config'))

let options = {
  // not needed for now
  // key: fs.readFileSync( 'mumble-key.pem' ),
  // cert: fs.readFileSync( 'mumble-cert.pem' )
}
let botname = config.mumble.botname

mumble.connect(config.mumble.uri, options, function (error, connection) {
  if (error) {
    throw new Error(error)
  }

  let inputStream = connection.inputStream({gain: 0.5, channels: 1})
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
