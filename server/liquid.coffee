
net = require 'net'
path = require 'path'
fetchJSON = require(__dirname + '/../scripts/fetcher').fetchJSON

timeout = 5000

module.exports = (config) ->

	liqReady = false
	client = null
	liqData = ""
	cmdQueue = []

	liqOnReady = ->
		console.log 'Liquidsoap: Ready!'
		liqReady = true

	liqOnData = (data) ->
		s = data.toString('utf8')
		liqData += s

		a = s.split "\r\n"
		a.pop()
		if a[a.length-1] == "END"
			d = liqData.split "\r\n"
			d.pop() # remove last newline
			d.pop() # remove END
			liqData = ""
			cb = cmdQueue.shift() # get command first in queue
			if cb
				if d.length == 1
					d = d[0].split "\n"
					if d.length == 1
						d = d[0]
				if Array.isArray d
					o = {}
					for line, i in d
						pos = line.indexOf "="
						if pos != -1
							key = line.substr 0, pos
							val = line.substr pos+1
							try
								o[key] = JSON.parse val
							catch err
								# do nothing
					d = o
					
				cb null, d

	liqOnError = (err) ->
		console.error "Liquidsoap: Socket error: "+err

	liqOnEnd = ->
		console.log 'Liquidsoap: Socket ended'
		client = null
		liqReady = false
		liqData = ""
		cmdQueue = []

	liqOnTimeout = ->
		console.log 'Liquidsoap: Socket timeout'
		client.end()

	liqConnect = ->
		console.log "Liquidsoap: Connecting.."
		client = net.connect
			host: config.liquidsoap.host || "localhost"
			port: config.liquidsoap.port_telnet || 1234
		client.once 'connect', liqOnReady
		client.on 'data', liqOnData
		client.once 'error', liqOnError
		client.once 'timeout', liqOnTimeout
		client.once 'end', liqOnEnd
		client.setTimeout 10*1000


	liqCheck = (cb) ->
		if liqReady
			cb null
		else
			if client == null
				liqConnect()
			sentCb = false
			errorMsg = null

			client.once 'connect', ->
				unless sentCb
					sentCb = true
					cb null
			client.once 'error', (err) ->
				errorMsg = err
			client.once 'end', ->
				unless sentCb
					sentCb = true
					cb ''+(errorMsg or 'end')

			setTimeout ->
				unless sentCb or false
					sentCb = true
					if client
						client.end()
					cb 'timeout'
			, timeout

	liqCommand = (command, cb) ->
		command = command+"\r\n"
		liqCheck (err) ->
			if err
				console.warn "Liquidsoap: Check error: " + err
				cb err, null
			else
				client.write command, 'utf8'
				cmdQueue.push (err, data) ->
					if err
						console.warn "Liquidsoap " + name+" " + args.join(' ') + ": " + err
						cb err, null
					else
						cb null, data

	dbUpdateCallbacks = []

	# no need to connect on startup at the moment
	#liqConnect()

	metadata = {}

	API =
		queue:
			getList: (cb) ->
				liqCommand "request.queue", (err, data) ->
					if err or data == ""
						cb err, []
					else
						list = data.split " "
						meta = []
						f = (i) ->
							liqCommand "request.metadata "+list[i], (err, data) ->
								if err
									
								else
									if typeof data == 'string'
										data = error: data, file: ""
									else
										data.file = data.filename and data.filename.replace(config.general.media_dir+"/", "") or data.initial_uri
										delete data.filename
									meta.push data
								++i
								if i < list.length
									f i
								else
									cb null, meta

						f 0

			add: (item, cb) ->
				liqCommand "request.push "+item, (err, data) ->
					cb && cb err

			ignore: (rid, cb) ->
				liqCommand "request.ignore "+rid, (err, data) ->
					cb err
			consider: (rid, cb) ->
				liqCommand "request.consider "+rid, (err, data) ->
					cb err

			smart: (thing, cb) ->
				liqCommand "smartqueue "+thing, (err, data) ->
					cb && cb err

		announce: (message, cb) ->
			liqCommand 'announce.push smart:'+message, (err, data) ->
				cb err

		skip: (cb) ->
			liqCommand 'skip', (err, data) ->
				cb && cb err

		setMeta: (m) ->
			metadata.title  = m.title or path.basename(m.filename, path.extname(m.filename))
			metadata.artist = m.artist or null
			metadata.album  = m.album or null
			metadata.albumartist = m.albumartist or null
			metadata.url    = m.url or null
			metadata.year   = +m.year or null
			metadata.art    = m.art or null
			metadata.bitrate = +m.bitrate or m.bitrate or null
			metadata.source = m.source or 'default'
			metadata.live =
				active: false
				stream_name: m.live_name or null
				user: m.live_displayname or null
				#username: m.live_username or null
				url: m.live_url or null
				twitter_handle: m.live_twitter or null

			if m.live_connected == 'yes'
				metadata.live.active = true
				metadata.source = 'live'

		updateMeta: (cb) ->
			fetchJSON 'http://'+config.liquidsoap.host+':'+config.liquidsoap.port_harbor+'/getmeta', null, (err, data) =>
				if err
					console.log "Liquidsoap: Couldn't fetch metadata: "+err
				else
					@setMeta data

		getMeta: ->
			return metadata


		eventStarted: (ev) ->
			list = (ev.description || "").trim().split('\n')
			for r in list
				API.queue.add 'smart:'+r


		eventEnded: (ev) ->
			# noop


	API.updateMeta()

						
	API
