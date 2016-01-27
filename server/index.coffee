'use strict'

commander = require 'commander'

pjson = require __dirname + '/../package.json'
config = require __dirname + '/../scripts/config'

args = commander
	.command 'radio'
	.version pjson.version
	.option('-d, --dev', 'run in development/debug mode')
	.option('-p, --port <number>', 'set the server http port', config.server.port || 8000)
	.parse process.argv

# process will exit here if commander help is displayed

# handle the arguments
config.server.port = args.port

if args.dev
	process.env.NODE_ENV = 'development'
	console.log 'running in development mode'

# continue to load modules
express = require 'express'
logger = require 'morgan'
favicon = require 'serve-favicon'
compression = require 'compression'
passport = require 'passport'
flash = require 'connect-flash'
session = require 'express-session'
bodyParser = require 'body-parser'
SessionStore = require 'express-mysql-session'
cookieParser = require 'cookie-parser'

require(__dirname+'/passport')(passport)
mpd = require(__dirname+'/mpd')(config)
liquid = require(__dirname+'/liquid')(config)
icecast = require(__dirname+'/icecast')(config)
scheduler = require(__dirname+'/scheduler')(config)
livestream = require(__dirname+'/livestream')(config)

scheduler.on 'started', liquid.eventStarted
scheduler.on 'ended', liquid.eventEnded

app = express()
inDev = app.get('env') == 'development'

app.disable 'x-powered-by' # save some bits

app.use logger 'dev'
app.use favicon __dirname + '/../build/icons/favicon.ico'

app.use cookieParser config.server.cookieSecret
app.use session
	secret: config.server.sessionSecret
	resave: false
	saveUninitialized: false
	store: new SessionStore config.mysql
	unset: 'destroy'
	cookie:
		maxAge: 365 * 24 * 60 * 60 * 1000

app.use passport.initialize()
app.use passport.session()
app.use flash()

app.use bodyParser.json() # for parsing incoming application/json

app.use compression()
app.set 'views', __dirname + '/views'


require(__dirname+'/routes')(app, passport, config, mpd, liquid, icecast, scheduler, livestream)


#	# No stacktraces
#	app.use (err, req, res, next) ->
#		res.status err.status || 500
#		res.render 'error',
#			message: err.message
#			error: {}

# Stacktraces
#app.use (err, req, res, next) ->
#	res.status err.status || 500
#	res.render 'error',
#		message: err.message
#		error: err.stack



# launch the server!
server = app.listen config.server.port, "0.0.0.0", ->
	console.log 'Parasprite Radio http server listening on port %d', server.address().port
server.on 'error', (err) ->
	console.error 'Server '+err, config.server.port
	process.exit 1
