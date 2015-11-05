
net = require 'net'
path = require 'path'
generateArt = require './utils/generateArt'

sse = require './sse'

timeout = 5000

module.exports = (config) ->


	liqCommand = (command, cb) ->
		command = command+"\r\n"
		sentCb = false
		errorMsg = null
		liqData = ''

		liqOnData = (data) ->
			s = data.toString('utf8')
			liqData += s

			a = s.split '\r\n'
			a.pop()
			if a[a.length-1] == 'END'
				d = liqData.split '\r\n'
				d.pop() # remove last newline
				d.pop() # remove END
				liqData = ''
				if d.length == 1
					d = d[0].split "\n"
					if d.length == 1
						d = d[0]
				if Array.isArray d
					out = {}
					o = out
					for line, i in d
						m = line.match /^--- (\d*) ---$/
						if m
							o = out[+m[1]] = {}
						pos = line.indexOf "="
						if pos != -1
							key = line.substr 0, pos
							val = line.substr pos+1
							try
								o[key] = JSON.parse val
							catch err
								# do nothing
					d = out
				unless sentCb
					sentCb = true
					client.end 'quit\r\n'
					cb null, d

		client = net.connect
			host: config.liquidsoap.host || "localhost"
			port: config.liquidsoap.port_telnet || 1234
		client.on 'data', liqOnData
		client.setTimeout 10*1000

		client.once 'connect', ->
			client.write command, 'utf8'
		client.once 'error', (err) ->
			console.error 'Liquidsoap: '+err
			errorMsg = err
		client.once 'timeout', () ->
			client.end()
		client.once 'end', ->
			unless sentCb
				sentCb = true
				cb ''+(errorMsg or 'end')

		setTimeout ->
			unless sentCb
				sentCb = true
				client.end()
				cb 'timeout'
		, timeout


	metadata = {}
	imagedata = null

	API =
		queue:
			getList: (cb) ->
				liqCommand "request.all", (err, data) ->
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
									if data.source and data.source.indexOf('queue') == 0 and data.status and data.status != 'destroyed'
										meta.push data
								++i
								if i < list.length
									f i
								else
									cb null, meta

						f 0

			add: (id, item, cb) ->
				liqCommand "queue"+id+".push "+item, (err, data) ->
					cb && cb err

			# ignore: (rid, cb) ->
			# 	liqCommand "request.ignore "+rid, (err, data) ->
			# 		cb err
			# consider: (rid, cb) ->
			# 	liqCommand "request.consider "+rid, (err, data) ->
			# 		cb err

			# smart: (thing, cb) ->
			# 	liqCommand "smartqueue "+thing, (err, data) ->
			# 		cb && cb err

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
			metadata.art    = config.server.api_prefix+'/now/art/small' #m.art or null
			metadata.bitrate = +m.bitrate or m.bitrate or null
			metadata.ext    = path.extname(path.basename(m.filename)).substring(1)
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

			generateArt (m.art or m.filename), (err, result) ->
				imagedata = result
				sse.broadcast 'metadata', metadata, true


		updateMeta: (cb) ->
			liqCommand 'sendmetadata', (err, data) ->
				if err
					console.error "Liquidsoap: Couldn't fetch metadata: "+err
				cb && cb err, data

		getMeta: ->
			return metadata

		getImage: ->
			return imagedata

		getHistory: (cb) ->
			liqCommand 'history.get', (err, data) ->
				if err
					cb err
					return
				list = []
				for id, item of data
					item.timestamp = new Date(item.on_air).getTime()
					list.push item
				list.sort (a, b) ->
					return b.timestamp - a.timestamp

				cb null, list


		eventStarted: (ev) ->
			list = (ev.description || "").trim().split('\n')
			for r in list
				API.queue.add 1, 'smart:'+r


		eventEnded: (ev) ->
			# noop


	API.updateMeta()


	API
