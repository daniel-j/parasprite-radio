'use strict'

const path = require('path')

require('babel-core/register')({
  plugins: [
    'transform-es2015-modules-commonjs',
    'syntax-async-functions',
    'transform-async-to-generator'
  ]
})

process.once('message', (args) => {
  if (args.dev) {
    process.env.NODE_ENV = 'development'
  } else {
    process.env.NODE_ENV = 'production'
  }

  const server = require(path.join(__dirname, 'server'))
  server.startServer(args).catch((err) => {
    console.error('' + err, err.stack || '')
  })

  process.on('message', (message) => {
    if (message === 'stop') {
      console.log('Worker: Recieved stop signal')
      const knex = require('./db').knex
      knex.destroy(() => {
        process.exit(0)
      })
    }
  })

  process.send('started')
})
