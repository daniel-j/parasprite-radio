express = require 'express'
path = require 'path'
fs = require 'fs'
mm = require 'musicmetadata'
fetchJSON = require('../scripts/fetcher').fetchJSON
Song = require './models/song'
User = require './models/user'


cleanpath = (p) ->
	path.join('/', p).substr(1)

isAdmin = (req, res, next) ->

	if (req.isAuthenticated() and req.user.level >= 5) or (req.query and req.query.apikey == "F5DCB721287C43C8987942B5F10C417E")
		next()

	else
		res.writeHead 401
		res.end '401 Unauthorized'

isInternal = (req, res, next) ->
	if req.ip == "127.0.0.1" or req.ip == "::1"
		next()
	else
		res.writeHead 401
		res.end '401 Unauthorized. Only internal!'

cors = (res) ->
	res.header "Access-Control-Allow-Origin", "*"
	res.header "Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"

htmloptions =
	root: __dirname + '/../build/document/'
	dotfiles: 'deny'
	maxAge: 365*24*60*60*1000


module.exports = (app, passport, config, mpd, liquid, icecast, scheduler, livestream) ->
	inDev = app.get('env') == 'development'

	EqBeats = require('./models/eqbeats')(config)

	internalRouter = express.Router()
	defaultRouter = express.Router()
	adminRouter = express.Router()


	internalRouter.post '/meta', (req, res) ->
		m = req.body
		if Object.keys(m).length == 0
			res.end '(none)'
		else
			liquid.setMeta m
			res.end JSON.stringify m, null, 1

	internalRouter.post '/authlive', (req, res) ->
		console.log req.body
		username = req.body.username || ''
		password = req.body.password || ''
		out = {}
		send = () ->
			res.end JSON.stringify(out, null, 1)

		if username.toLowerCase() == 'source' and password != ''
			User.authUserWithShow password, (err, show, user, userAuth) ->
				if err
					console.error err
					out.error = 'Invalid token: '+err
					send()
					return

				userTwitter = ''
				for a in userAuth
					if a.provider == 'twitter'
						userTwitter = a.username
				out.live_unique = user.id+'_'+show.id
				out.live_userId = user.id+''
				out.live_showId = show.id+''
				out.live_username = user.username || ''
				out.live_displayname = user.displayName || ''
				out.live_twitter = show.twitter || userTwitter || ''
				out.live_name = show.name || ''
				out.live_description = show.description || ''
				out.url = show.url || user.url || ''
				out.art = show.art || user.avatarUrl || ''
				send()
		else
			out.error = 'Wrong username or password'
			send()

	# internalRouter.get '/liq/yt', (req, res) ->
	# 	url = req.query.url
	# 	console.log 'Remuxing youtube video '+url
	# 	ytdl = child_process.spawn 'youtube-dl', ['--restrict-filenames', '-f', 'bestaudio', '-g', url]
	# 	d = ""
	# 	ytdl.stdout.on 'data', (data) ->
	# 		d += data.toString 'utf8'
	# 	ytdl.once 'close', ->
	# 		https.get d.trim(), (aacdata) ->
	# 			tmpfile = temp.createWriteStream()
	# 			console.log 'Running ffmpeg...'
	# 			ffmpeg = child_process.spawn 'ffmpeg', ['-y', '-loglevel', 'warning', '-i', '-', '-acodec', 'copy', '-f', 'mp4', tmpfile.path], stdio: 'pipe'
	# 			ffmpeg.stderr.pipe process.stderr
	# 			ffmpeg.stdout.pipe process.stdout
	# 			aacdata.pipe ffmpeg.stdin


	# 			ffmpeg.once 'close', ->
	# 				console.log 'Remuxing complete! Sending...'
	# 				res.setHeader "Content-Type", "audio/mp4"
	# 				s = fs.createReadStream tmpfile.path
	# 				s.pipe res

	# 				s.once 'close', ->
	# 					fs.unlink tmpfile.path, ->
	# 						console.log 'Sent and removed temporary file!'
	# 	###child_process.exec "wget -qO- $(youtube-dl --restrict-filenames -f bestaudio -g "+url+") | ffmpeg -loglevel panic -i - -f mp3 -", maxBuffer: 1024 * 1024 * 500, (err, stdout, stderr) ->
	# 		if err
	# 			res.status(502).end(""+err)
	# 		else
	# 			res.setHeader "Content-Type", "audio/mpeg"
	# 			res.end stdout
	# 	###


	defaultRouter.get '/', (req, res) ->
		#console.log req.session.cookie
		res.sendFile 'index.html', htmloptions
	defaultRouter.get '/popout', (req, res) ->
		res.sendFile 'popout.html', htmloptions
	defaultRouter.get '/livestream.html', (req, res) ->
		res.sendFile 'livestream.html', htmloptions




	defaultRouter.get '/api/config', (req, res) ->
		getValue = (k, o, i) ->
			if !i then i = 0
			x = o[k[i]]
			if typeof x == 'object' and x != null and !Array.isArray(x)
				getValue(k, x, i+1)
			else
				x
		keys = [
			'general.baseurl', 'general.streamurl', 'general.irc', 'general.twitter',
			'radio.title',
			'icecast.mounts',
			'google.publicApiKey', 'google.calendarId',
			'livestream.url_thumbnail', 'livestream.url_rtmp', 'livestream.url_dash', 'livestream.url_hls',

		]
		out = {}

		for key in keys
			k = key.split('.')
			v = getValue(k, config)
			if v == undefined || v == null then v = ""
			out[String(key).replace(/\./g,'_')] = v

		res.json out

	defaultRouter.get '/stream', (req, res) ->
		res.redirect config.streamurl+config.icecast.mounts[0]

	defaultRouter.get '/auth/twitter',
		passport.authenticate 'twitter'
	defaultRouter.get '/auth/twitter/callback',
		passport.authenticate 'twitter',
			successRedirect: '/'
			failureRedirect: '/login'
			failureFlash: "Login failed"
			#successFlash: "Login succeeded"

	defaultRouter.get '/auth/poniverse',
		passport.authenticate 'poniverse'
	defaultRouter.get '/auth/poniverse/callback',
		passport.authenticate 'poniverse',
			successRedirect: '/'
			failureRedirect: '/login'
			failureFlash: "Login failed"
			#successFlash: "Login succeeded"

	defaultRouter.get '/logout', (req, res) ->
		if req.isAuthenticated()
			req.logout()
			#req.flash 'info', 'You are now logged out'
		res.redirect '/'


	defaultRouter.get '/api/user', (req, res) ->
		if req.user
			User.findWithAuth req.user.id, (err, user) ->
				res.json user
		else
			res.json {}

	defaultRouter.post '/api/show/create', (req, res) ->
		if req.user
			User.createShow req.user.id, req.body, (err) ->
				if err
					console.error 'Error creating show: '+err
					res.json error: ''+err
					return
				res.json 'ok'
		else
			res.json error: 'not logged in'

	defaultRouter.delete '/api/show/:id', (req, res) ->
		if req.user
			User.removeShow req.user.id, req.params.id, (err) ->
				if err
					console.error 'Error removing show: '+err
					res.json error: ''+err
					return
				res.json 'ok'
		else
			res.json error: 'not logged in'

	defaultRouter.get '/api/show', (req, res) ->
		if req.user
			User.getShows req.user.id, (err, list) ->
				if err
					console.error 'Error fetching show: '+err
					res.json error: ''+err
					return
				res.json list
		else
			res.json error: 'not logged in'

	defaultRouter.get '/api/show/:id/updatetoken', (req, res) ->
		if req.user
			User.updateToken req.user.id, req.params.id, (err, token) ->
				if err
					console.error 'Error updating token: '+err
					res.json error: ''+err
					return
				res.json token: token
		else
			res.json error: 'not logged in'

	defaultRouter.get '/api/flash', (req, res) ->
		res.json req.flash()

	defaultRouter.get '/api/flash/:name', (req, res) ->
		res.json req.flash req.params.name


	defaultRouter.get '/api/now/art/:size', (req, res) ->
		size = req.params.size
		if size == 'full' then size == 'original'
		sizes = ['original', 'tiny', 'small']
		if sizes.indexOf(size) == -1
			res.redirect sizes[0]
			return
		info = liquid.getImage()
		if info
			if size == 'original'
				data = info.original
				type = info.type
			else
				data = info.sizes[size]
				type = ext: 'png', mime: 'image/png'

		if info and data
			console.log 'got image!', size, type
			res.setHeader 'Content-Type', type.mime
			res.end data
		else
			console.log 'no image found :/'
			res.setHeader 'Content-Type', 'image/png'
			#res.sendFile 'pr-cover-'+size+'.png', root: __dirname + '/../static/img/cover/'
			res.sendFile 'cover-small.png', root: __dirname + '/../static/img/cover/'
	###
	defaultRouter.get '/api/now/json', (req, res) ->
		cors(res)
		res.setHeader "Content-Type", "application/json"
		res.sendFile 'json', root: __dirname+'/../util/now/'
	###

	defaultRouter.get '/api/status', (req, res) ->
		cors(res)
		o =
			meta: liquid.getMeta()
			info: icecast.getInfo()
			livestream: livestream.getInfo()
		res.json o

	###
	defaultRouter.get '/api/lastfm/recent', (req, res) ->
		cors(res)

		fetchJSON 'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user='+config.lastfm.username+'&api_key='+config.lastfm.api.key+'&format=json&limit='+config.lastfm.api.limit+'&extended=1', null, (err, data) ->
			if err
				res.end 'error: ' + err
			else
				res.json data
	###

	defaultRouter.get '/api/history', (req, res) ->
		imagesize = +(req.query.imagesize || 1)
		if imagesize < 0 then imagesize = 0
		if imagesize > 3 then imagesize = 3
		limit = +(req.query.limit || config.lastfm.api.limit)
		if limit < 1 then limit = 1
		if limit > config.lastfm.api.limit then limit = config.lastfm.api.limit
		cors(res)

		fetchJSON 'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user='+config.lastfm.username+'&api_key='+config.lastfm.api.key+'&format=json&limit='+limit+'&extended=1', null, (err, data) ->
			if err
				console.log 'lastfm error: ' + err, data
				tracks = []
			else
				try
					tracks = data.recenttracks.track
					if !Array.isArray(tracks) then tracks = [tracks]
					tracks.forEach (track, i) ->
						tracks[i] =
							title: track.name
							artist: track.artist.name
							album: track.album['#text']
							art: track.image[imagesize]['#text'] || track.artist.image[imagesize]['#text'] || (config.general.baseurl+'img/cover/cover-small.png')
							timestamp: if track.date then +track.date.uts else Date.now()/1000|0
							url: track.url
						#tracks[i].art = tracks[i].art.replace 'http://', 'https://'
						tracks[i].text = tracks[i].artist+' - '+tracks[i].title
				catch e
					console.log 'lastfm error: ' + e, data && data.recenttracks && data.recenttracks.track
					tracks = []
			res.json tracks

	defaultRouter.get '/api/radio', (req, res) ->
		cors(res)

		meta = liquid.getMeta()
		text = (if meta.artist then meta.artist + ' - ' else '') + meta.title
		songInfo =
			title: meta.title
			artist: meta.artist
			album: meta.album
			albumartist: meta.albumartist
			text: text
			url: meta.url or if meta.artist and meta.title then "http://www.last.fm/music/"+encodeURIComponent(meta.artist)+"/_/"+encodeURIComponent(meta.title)
			year: meta.year
			art: meta.art or config.general.baseurl+'api/now/art/small'
			bitrate: meta.bitrate
			ext: meta.ext
			source: meta.source

		songInfo.id = Song.getSongHash songInfo

		events = scheduler.getEvents()
		events.calendar = config.google.calendarId
		events.now = new Date()

		o =
			general:
				name: config.radio.title
				description: config.radio.description
				logo: config.general.baseurl+'img/icons/parasprite-radio.png'
				url: config.radio.url
				irc: config.general.irc
				twitter_handle: config.general.twitter

			radio:
				online: icecast.isOnline()
				listeners: icecast.getListenerCount()
				listener_peak: icecast.getListenerPeak()

				song_info: songInfo

				streams: icecast.getStreams()

				live: meta.live

				url_history: config.general.baseurl+'api/history?limit=5'

			livestream:
				online: livestream.isOnline()
				viewers: livestream.getViewCount()
				url: config.general.baseurl+'#livestream'
				url_iframe: config.general.baseurl+'livestream.html'
				url_thumbnail: config.livestream.url_thumbnail
				url_rtmp: config.livestream.url_rtmp
				url_dash: config.livestream.url_dash
				url_hls: config.livestream.url_hls

			events: events

		res.json o


	# \/ ADMIN ENDPOINTS \/

	adminRouter.get '/admin/*', (req, res) ->
		res.sendFile 'admin.html', htmloptions
	adminRouter.get '/admin', (req, res) ->
		res.redirect '/admin/'


	adminRouter.get '/api/update', (req, res) ->
		mpd.update (err) ->
			if err
				json = error: err
			else
				json = error: null
			res.json json

	adminRouter.get '/api/search', (req, res) ->
		query = req.query.q
		type = req.query.t || 'any'
		mpdres = null
		mpdids = null
		eqres = null
		eqids = null

		finalize = () ->
			final = [].concat mpdres
			eqres = eqres.filter (t) ->
				mpdids.indexOf(t.id) == -1
			final = final.concat eqres
			res.json final

		mpd.search type, query, (err, data) ->
			mpdres = []
			mpdids = []
			if !err
				data.forEach (t) ->
					t.source = 'local'
					t.id = Song.getSongHash t
					mpdids.push t.id
					mpdres.push t

			if eqres
				finalize()

		if type == 'any' or type == 'title' or type == 'artist'

			if type == 'title'
				eqbeatsQuery = 'title:'+query
			else if type == 'artist'
				eqbeatsQuery = 'artist:'+query
			else
				eqbeatsQuery = query

			EqBeats.querySearch eqbeatsQuery, (err, data) ->
				eqres = []
				eqids = []
				if !err
					data.forEach (t) ->
						o =
							title: t.title
							artist: t.artist.name
							date: new Date(t.timestamp*1000).getFullYear()
							'last-modified': new Date t.timestamp*1000
							url: t.link
							art: t.download.art
							source: 'eqbeats'
						o.id = Song.getSongHash o
						eqres.push o
						eqids.push o.id
				if mpdres
					finalize()
		else
			eqres = []
			eqids = []


	###
	adminRouter.get '/api/albums', (req, res) ->
		mpd.getAlbums (err, albums) ->
			if err
				json = []
			else
				json = albums
			res.json json

	adminRouter.get '/api/artists', (req, res) ->
		mpd.getArtists (err, artists) ->
			if err
				json = []
			else
				json = artists
			res.json json

	adminRouter.get '/api/track', (req, res) ->
		filename = req.query.f or null
		if filename is null
			res.json error: 'No filename provided'
		else
			mpd.getTrackInfo cleanpath(filename), (err, info) ->
				if err
					json = error: err
				else
					json = info

				res.json json
	###

	adminRouter.get '/api/files/*', (req, res) ->
		filename = cleanpath req.params[0]
		mpd.lsinfo filename, (err, list) ->
			if err
				json = error: err
			else
				json = list
			res.json json

	adminRouter.get '/api/playlists', (req, res) ->
		mpd.getPlaylists (err, list) ->
			if err
				json = []
			else
				json = list
			res.json json

	adminRouter.get '/api/playlist/:name', (req, res) ->
		name = req.params.name
		mpd.getPlaylist name, (err, list) ->
			if err
				json = error: err
			else
				json = list
			res.json json


	###
	adminRouter.get '/stream/*', (req, res) ->
		filename = cleanpath req.params[0]
		mpd.getTrackInfo filename, (err, info) ->
			if info and info.file == filename
				res.sendFile filename,
					root: config.media_dir
			else
				res.status(404).end('File not found in the music database')
	###

	adminRouter.get '/api/metadata/*', (req, res) ->
		filename = cleanpath req.params[0]
		stream = fs.createReadStream config.media_dir+'/'+filename
		parser = mm stream
		parser.on 'metadata', (result) ->
			res.end JSON.stringify result
		parser.on 'done', (err) ->
			if err then res.end ''+err
			stream.destroy()
		stream.on 'error', (err) ->
			res.end ''+err

	###adminRouter.get '/api/set/*', (req, res) ->
		filename = cleanpath req.params[0]
		imageFromFile path.join(config.media_dir, filename), (err, type, data) ->
			if err
				res.end ''+err
			else
				res.setHeader "Content-Type", type
				res.end data

		##id3 {file: config.media_dir+'/'+filename, type: id3.OPEN_LOCAL}, (err, tags) ->
			if err
				res.status(500).end err+''
			else

				if tags.v2 and tags.v2.image
					res.setHeader("Content-Type", tags.v2.image.mime);
					buffer = new Buffer(new Uint8Array(tags.v2.image.data));
					res.end buffer.toString('binary'), 'binary'
				else
					res.end 'no image data'###

	adminRouter.get '/api/queue/list', (req, res) ->
		liquid.queue.getList (err, list) ->
			if err
				json = error: err
			else
				json = list
			res.json json

	adminRouter.get '/api/queue', (req, res) ->
		item = req.query.add
		#if (item.indexOf('/') == 0)
		#	item = config.general.media_dir+item
		liquid.queue.add 'smart:'+item, (err) ->
			if err
				json = error: err
			else
				json = error: null
			res.json json

	adminRouter.get '/api/announce', (req, res) ->
		liquid.announce req.query.message, (err) ->
			if err
				json = error: err
			else
				json = error: null
			res.json json

	adminRouter.get '/api/skip', (req, res) ->
		liquid.skip (err) ->
			if err
				json = error: err
			else
				json = error: null
			res.json json

	adminRouter.get '/api/listeners', (req, res) ->
		res.json icecast.getListeners()


	app.use '/', defaultRouter
	app.use '/build/', express.static __dirname + '/../build/', { maxAge: 365*24*60*60*1000 }

	app.use '/', express.static __dirname + '/../static', { maxAge: 365*24*60*60*1000 }

	app.use '/internal/', isInternal, internalRouter
	app.use '/', isAdmin, adminRouter
