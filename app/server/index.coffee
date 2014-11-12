'use strict'

commander = require 'commander'

pjson = require __dirname + '/../package.json'
config = require __dirname + '/../../config.json'

args = commander
	.command 'radio'
	.version pjson.version
	.option('-d, --dev', 'run in development/debug mode')
	.option('-p, --port <number>', 'set the server http port', config.port || 8000)
	.parse process.argv

# process will exit here if commander help is displayed


# continue to load modules
express = require 'express'
logger = require 'morgan'
favicon = require 'serve-favicon'
compression = require 'compression'
passport = require 'passport'
flash = require 'connect-flash'
session = require 'express-session'
RedisStore = require('connect-redis')(session)
cookieParser = require 'cookie-parser'
#lessMiddleware = require 'less-middleware'

require(__dirname+'/passport')(passport)
mpd = require(__dirname+'/mpd')(config)

# handle the arguments
config.port = args.port

if args.dev
	process.env.NODE_ENV = 'development'
	console.log 'running in development mode'


app = express()
inDev = app.get('env') == 'development'

redisStore = new RedisStore config.redis


app.use logger 'dev'
app.use favicon __dirname + '/../www/img/icons/favicon.ico'

app.use cookieParser config.cookieSecret
app.use session
	secret: config.sessionSecret
	resave: true
	saveUninitialized: true
	store: redisStore
	cookie:
		maxAge: 365 * 24 * 60 * 60 * 1000

app.use passport.initialize()
app.use passport.session()
app.use flash()

app.use compression()
app.set 'views', __dirname + '/views'

# app.use lessMiddleware __dirname + '/../www',
# 	dest: __dirname+'/../www'
# 	#cacheFile: __dirname+'/www/style/cache.json'
# 	debug: inDev
# 	compiler:
# 		sourceMap: inDev
# 	once: !inDev


require(__dirname+'/routes')(app, passport, config, mpd)


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
server = app.listen config.port, ->
	console.log 'Parasprite Radio http server listening on port %d', server.address().port
