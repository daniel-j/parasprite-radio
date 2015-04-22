
http = require 'http'

timeout = 5000


module.exports = (config) ->

	config.icecast.port = config.icecast.port || 8000;

	#fetchJson = (cb) ->
	#	JSONGrabber "http://"+config.icecast.host+":"+config.icecast.port+"/status-json.xsl", (err, data) ->
	#		console.log err, data

	#fetchJson()

	callbacks = {}
	iceData = {}


	iceReady = false
	client = null

	iceOnReady = ->
		console.log 'Icecast: Ready!'
		iceReady = true

	iceOnEvent = (ev) ->
		data = ev.match(/^[^ ]* ([^ ]*) ([^ ]*) (.*)$/)
		if !data then return

		scope = data[1]
		key = data[2]
		value = data[3]
		if !iceData[scope] then iceData[scope] = {}
		iceData[scope][key] = value
		if value == 'null'
			delete iceData[scope][key]
		if key == 'null'
			delete iceData[scope]

		#if key == 'listeners' or key == 'title'
		#console.log "Icecast:", scope, key, value

		if callbacks[scope] and callbacks[scope][key]
			for cb in callbacks[scope][key]
				cb(value)

	iceOnError = (err) ->
		console.error "Icecast: Socket error: "+err
		client = null
		iceReady = false
		iceData = {}

		setTimeout iceConnect, timeout

	iceOnEnd = ->
		console.log 'Icecast: Socket ended'
		client = null
		iceReady = false
		iceData = {}

		setTimeout iceConnect, timeout

	iceConnect = ->
		if client
			return

		opts =
			method: 'STATS'
			host: config.icecast.host
			port: config.icecast.port
			auth: config.icecast.username+':'+config.icecast.password

		client = http.request(opts, (res) ->
			if res.statusCode == 200
				res.on 'data', (chunk) ->
					s = chunk.toString().trim()
					a = s.split("\n")
					for ev in a
						iceOnEvent ev
				res.once 'end', iceOnEnd
				res.once 'error', iceOnError
				iceOnReady()
			else
				res.end()
				iceOnError res.statusCode
		).on 'error', iceOnError
		client.end()

		console.log "Icecast: Connecting.."

	iceConnect()


	API =

		getListenerCount: ->
			c = 0
			for scope, keys of iceData
				if typeof keys.listeners isnt 'undefined' and scope.indexOf('/') == 0
					if config.icecast.mounts.indexOf(scope.substr(1)) != -1
						c += +keys.listeners
			c

		isOnline: ->
			return !!iceData['/'+config.icecast.mounts[0]]

		getInfo: ->
			listeners: @getListenerCount()
			online: @isOnline()

		register: (scope, key, cb) ->
			if !callbacks[scope]
				callbacks[scope] = {}

			if !callbacks[scope][key]
				callbacks[scope][key] = []

			callbacks[scope][key].push cb

	API
