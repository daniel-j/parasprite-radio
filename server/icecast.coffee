
http = require 'http'

timeout = 5000


module.exports = (config) ->

	servers = {}
	iceData = {}
	lastListenerCount = 0
	listenerPeak = 0

	config.icecast.host = config.icecast.host || 'localhost'
	config.icecast.port = config.icecast.port || 8000
	config.icecast.user = config.icecast.user || 'admin'
	config.icecast.admin.password = config.icecast.admin.password || 'hackmemore'

	servers[config.icecast.host+':'+config.icecast.port] =
		host: config.icecast.host,
		port: config.icecast.port,
		user: config.icecast.admin.user,
		password: config.icecast.admin.password
		relay: false

	relays = config.icecast.relay || []
	for relay, i in relays
		relay.host = relay.host || 'localhost'
		relay.port = relay.port || 8000
		relay.user = relay.user || config.icecast.admin.user
		relay.password = relay.password || config.icecast.admin.password
		relay.relay = true

		k = relay.host+':'+relay.port
		if !servers[k]
			servers[k] = relay

	handleServer = (server) ->
		k = server.host+':'+server.port
		iceData[k] = stats = {}

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
			if !stats[scope] then stats[scope] = {}
			stats[scope][key] = value
			if value == 'null'
				delete stats[scope][key]
			if key == 'null'
				delete stats[scope]
			count = API.getListenerCount()

			if config.icecast.mounts.indexOf(scope.substr 1) != -1 and key == 'listener_peak' and stats[scope][key] > listenerPeak
				listenerPeak = +stats[scope][key]
			if count > listenerPeak
				listenerPeak = count

			if count != lastListenerCount
				lastListenerCount = count
				console.log("listener count: "+count)

		iceOnError = (err) ->
			console.error "Icecast: Socket error: "+err
			client = null
			iceReady = false
			iceData[k] = stats = {}

			setTimeout iceConnect, timeout

		iceOnEnd = ->
			console.log 'Icecast: Socket ended'
			client = null
			iceReady = false
			iceData[k] = stats = {}

			setTimeout iceConnect, timeout

		iceConnect = ->
			if client
				return

			opts =
				method: 'STATS'
				host: server.host
				port: server.port
				auth: server.user+':'+server.password

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
					res.end && res.end()
					iceOnError res.statusCode
			).on 'error', iceOnError
			client.end()

			console.log "Icecast: Connecting to "+k+".."

		iceConnect()

	Object.keys(servers).forEach (k) ->
		handleServer servers[k]

	fixAudioInfo = (m) ->
		o = {}
		info = m.audio_info.split ';'
		info.forEach (v, i) ->
			pair = v.split '='
			o[pair[0]] = pair[1]
		o.type = m.server_type
		o

	API =

		getListenerCount: ->
			count = 0
			for k, stats of iceData
				c = 0
				for scope, keys of stats
					if scope.indexOf('/') == 0 and config.icecast.mounts.indexOf(scope.substr(1)) != -1
						if +keys.listeners > 0
							c += +keys.listeners
						if servers[k].relay and keys.title
							c -= 1
				count += Math.max c, 0
			count

		getListenerPeak: -> listenerPeak

		isOnline: ->
			return !!iceData[config.icecast.host+':'+config.icecast.port]['/'+config.icecast.mounts[0]]

		getInfo: ->
			listeners: @getListenerCount()
			listener_peak: @getListenerPeak()
			online: @isOnline()

		getStreams: ->
			streams = []
			config.icecast.mounts.forEach (mount) ->
				m = iceData[config.icecast.host+':'+config.icecast.port]['/'+mount]
				if m
					streams.push
						name: mount
						url: m.listenurl
						listeners: +m.listeners
						listener_peak: +m.listener_peak
						audio_info: fixAudioInfo m
			streams

	API
