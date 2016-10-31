
import path from 'path'

import express from 'express'
import logger from 'morgan'
import favicon from 'serve-favicon'
import compression from 'compression'
import passport from 'passport'
import flash from 'connect-flash'
import session from 'express-session'
import bodyParser from 'body-parser'
import SessionStore from 'express-mysql-session'
import cookieParser from 'cookie-parser'
import config from '../scripts/config'
import IO from 'socket.io'

import passportManager from './passport'
import mpdManager from './mpd'
import liquidManager from './liquid'
import icecastManager from './icecast'
import Scheduler from './scheduler'
import livestreamManager from './livestream'
import routes from './routes'

export async function startServer (args = {}) {
  config.server.port = args.port

  if (args.dev) {
    process.env.NODE_ENV = 'development'
    console.log('running in development mode')
  } else {
    process.env.NODE_ENV = 'production'
  }

  const app = express()
  const server = require('http').createServer(app)
  const io = IO(server, {path: '/socket.io'})

  passportManager(passport)
  let mpd = mpdManager(config)
  let liquid = liquidManager(config)
  let icecast = icecastManager(config)
  let scheduler = Scheduler(config)
  let livestream = livestreamManager(config, io)

  scheduler.on('started', liquid.eventStarted)
  scheduler.on('ended', liquid.eventEnded)

  app.disable('x-powered-by') // save some bits

  app
    .use(logger('dev'))
    .use(favicon(path.join(__dirname, '/../build/icons/favicon.ico')))

    .use(cookieParser(config.server.cookieSecret))
    .use(session({
      secret: config.server.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: new SessionStore(config.mysql),
      unset: 'destroy',
      cookie: {
        maxAge: 365 * 24 * 60 * 60 * 1000
      }
    }))

    .use(passport.initialize())
    .use(passport.session())
    .use(flash())

    .use(bodyParser.json()) // for parsing incoming application/json

    .use(compression())

  routes(app, passport, config, mpd, liquid, icecast, scheduler, livestream)

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
    console.log('Parasprite Radio http server listening on port %d', server.address().port)
  })
  server.on('error', function (err) {
    console.error('Server ' + err, config.server.port)
    process.exit(1)
  })
}
