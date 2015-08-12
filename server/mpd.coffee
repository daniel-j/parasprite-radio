mpd = require 'mpd'

timeout = 5000

parseArrayMessage = (msg, dividers = ['file', 'directory']) ->
	# Function taken from
	# https://github.com/andrewrk/mpd.js/commit/729616d2d9df496081e5a37d35514357f88cd558

	results = []
	obj = null

	msg.split('\n').forEach (p) ->
		if p.length == 0
			return
		
		keyValue = p.match /([^ ]+): (.*)/
		if keyValue == null
			throw new Error 'Could not parse entry "' + p + '"'

		keyValue[1] = keyValue[1].toLowerCase()
		n = +keyValue[2]
		if !isNaN(n) and keyValue[2].length == n.toString().length
			keyValue[2] = n

		if dividers.indexOf(keyValue[1]) != -1
			unless obj is null then results.push obj
			obj = {}

		if !obj
			obj = {}

		obj[keyValue[1]] = keyValue[2]
		
	if obj
		results.push obj
	results

parseKeyValueMessage = (msg) ->
	result = {}

	msg.split('\n').forEach (p) ->
		if p.length == 0
			return
		
		keyValue = p.match /([^ ]+): (.*)/
		if keyValue == null
			throw new Error 'Could not parse entry "' + p + '"'

		keyValue[1] = keyValue[1].toLowerCase()
		n = +keyValue[2]
		if !isNaN(n) and keyValue[2].length == n.toString().length
			keyValue[2] = n
		
		result[keyValue[1]] = keyValue[2]
	
	result


perfectSort = (a, b) ->
	a = a+''
	b = b+''
	a.toLowerCase().localeCompare(b.toLowerCase())

perfectSortKey = (key) ->
	(a, b) ->
		a[key] = a[key]+''
		b[key] = b[key]+''
		a[key].toLowerCase().localeCompare(b[key].toLowerCase())

module.exports = (config) ->

	mpdReady = false
	client = null

	mpdOnReady = ->
		console.log 'MPD: Ready!'
		mpdReady = true

		if typeof config.mpd.password is 'string' and config.mpd.password != ""
			client.sendCommand mpd.cmd('password', [config.mpd.password]), (err, data) ->
				if err
					console.warn "MPD: Password INCORRECT"
					return
				console.log "MPD: Password OK"

	mpdOnUpdate = (type) ->
		client.sendCommand mpd.cmd('status', []), (err, data) ->
			if err
				console.error err
			else
				data = parseKeyValueMessage data
				id = data.updating_db || null
				if id != null
					console.log "MPD: Updating DB (#"+id+")"
				else
					console.log "MPD: Update complete"
					i = 0
					while i < dbUpdateCallbacks.length
						dbUpdateCallbacks[i](null)
						i++
					dbUpdateCallbacks.length = 0
	mpdOnError = (err) ->
		console.error "MPD: Socket error: "+err

	mpdOnEnd = ->
		console.log 'MPD: Socket ended'
		client = null
		mpdReady = false

	mpdConnect = ->

		client = mpd.connect
			host: config.mpd.host || "localhost"
			port: config.mpd.port || 6600
		console.log "MPD: Connecting.."
		client.on 'ready', mpdOnReady
		client.on 'system-update', mpdOnUpdate
		client.on 'error', mpdOnError
		client.on 'end', mpdOnEnd


	mpdCheck = (cb) ->
		if mpdReady
			cb null
		else
			if client == null
				mpdConnect()
			sentCb = false
			errorMsg = null

			client.once 'ready', ->
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
						client.socket.end()
					cb 'timeout'
			, timeout

	mpdCommand = (name, args = [], cb) ->
		if typeof args == 'string'
			args = [args]
		mpdCheck (err) ->
			if err
				console.warn "MPD: Check error: " + err
				cb err, null
			else
				client.sendCommand mpd.cmd(name, args), (err, data) ->
					if err
						console.warn "MPD " + name+" " + args.join(' ') + ": " + err
						cb err, null
					else
						cb null, data

	dbUpdateCallbacks = []

	mpdConnect()

	

	API =
		search: (type, text, cb) ->
			# perform empty search check
			if text == ''
				cb null, []
				return

			mpdCommand 'search', [type, text], (err, data) ->
				if err
					cb null, []
				else
					tracks = parseArrayMessage data
					i = 0
					while i < Math.min(tracks.length, 50)
						if tracks[i].hasOwnProperty 'file'
							i++
						else
							tracks.splice i, 1
					cb null, tracks

		update: (cb) ->
			mpdCommand 'update', [], (err, data) ->
				if err
					cb err
				else
					dbUpdateCallbacks.push cb

		getAlbums: (cb) ->
			mpdCommand 'list', ['album'], (err, data) ->
				if err
					cb null, []
				else
					albums = parseArrayMessage data, 'album'
					i = 0
					while i < albums.length
						albums[i] = albums[i].album
						i++
					albums.sort perfectSort
					
					cb null, albums

		getArtists: (cb) ->
			mpdCommand 'list', ['artist'], (err, data) ->
				if err
					cb null, []
				else
					artists = parseArrayMessage data, 'artist'
					i = 0
					while i < artists.length
						artists[i] = artists[i].artist
						i++
					artists.sort perfectSort
					cb null, artists

		getAlbumArtists: (cb) ->
			mpdCommand 'list', ['albumartist'], (err, data) ->
				if err
					cb null, []
				else
					artists = parseArrayMessage data
					i = 0
					while i < artists.length
						artists[i] = artists[i].AlbumArtist
						i++
					artists.sort perfectSort
					cb null, artists

		getTrackInfo: (file, cb) ->
			mpdCommand 'find', ['file', file], (err, data) ->
				if err
					cb err, null
				else
					cb null, parseKeyValueMessage data

		lsinfo: (uri = '', cb) ->
			mpdCommand 'lsinfo', [uri], (err, data) ->
				if err
					cb null, []
				else
					cb null, parseArrayMessage data

		getPlaylists: (cb) ->
			mpdCommand 'listplaylists', [], (err, data) ->
				if err
					cb err, null
				else
					cb null, parseArrayMessage(data, 'playlist')

		getPlaylist: (name, cb) ->
			mpdCommand 'listplaylistinfo', [name], (err, data) ->
				if err
					cb err, null
				else
					console.log data
					cb null, parseArrayMessage data

	API
