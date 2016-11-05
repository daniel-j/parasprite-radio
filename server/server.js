'use strict'

import path from 'path'

import express from 'express'
import logger from 'morgan'
import favicon from 'serve-favicon'
import compression from 'compression'
import session from 'express-session'
import bodyParser from 'body-parser'
import expressMysqlSession from 'express-mysql-session'
import cookieParser from 'cookie-parser'
import IO from 'socket.io'

import config from '../scripts/config'

import './passport'
import mpd from './mpd'
import liquid from './liquid'
import icecast from './icecast'
import livestream from './livestream'
import scheduler from './scheduler'

import routes from './routes'

const MySQLStore = expressMysqlSession(session)

export async function startServer (args = {}) {
  config.server.port = args.port

  const app = express()
  const server = require('http').createServer(app)
  const io = IO(server, {path: '/socket.io'})

  mpd.initialize()
  icecast.initialize()
  livestream.initialize(io)
  scheduler.initialize()

  scheduler.on('started', liquid.eventStarted)
  scheduler.on('ended', liquid.eventEnded)

  app.disable('x-powered-by') // save some bits

  app.set('trust proxy', (ip) => {
    if (ip === '127.0.0.1') return true // trusted IPs
    else return false
  })

  app
    .use(logger('dev', {
      // log every request in verbose mode, else only log errors
      skip: (req, res) => !args.verbose && res.statusCode < 400
    }))
    .use(favicon(path.join(__dirname, '../build/icons/favicon.ico')))

    .use(cookieParser(config.server.cookieSecret))
    .use(session({
      secret: config.server.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: new MySQLStore(config.mysql),
      unset: 'destroy',
      cookie: {
        maxAge: 365 * 24 * 60 * 60 * 1000
      }
    }))

    .use(bodyParser.json()) // for parsing incoming application/json

    .use(compression())

  routes(app)

  //  // No stacktraces
  //  app.use (err, req, res, next) ->
  //    res.status err.status || 500
  //    res.render 'error',
  //      message: err.message
  //      error: {}

  //  // Stacktraces
  //  app.use (err, req, res, next) ->
  //    res.status err.status || 500
  //    res.render 'error',
  //      message: err.message
  //      error: err.stack

  // launch the server!
  server.listen(config.server.port, '0.0.0.0', function () {
    console.log('HTTP: Listening on port %d', server.address().port)
  })
  server.on('error', function (err) {
    console.error('Server ' + err, config.server.port)
    process.exit(1)
  })
}
