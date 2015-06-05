express = require 'express'
path = require 'path'
fs = require 'fs'
mm = require 'musicmetadata'

cleanpath = (p) ->
	path.join('/', p).substr(1)

isAdmin = (req, res, next) ->

	if req.isAuthenticated() and req.user.level >= 5
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

typeToMime = (type) ->
	switch type
		when 'jpg' then type = 'image/jpeg'
		when 'jpeg' then type = 'image/jpeg'
		when 'png' then type = 'image/png'
		else type = null
	type

cors = (res) ->
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");


imageFromFile = (filename, cb) ->
	stream = fs.createReadStream filename
	gotimg = false
	#allowed = ['.mp3', '.ogg', '.flac', '.wma']
	#if allowed.indexOf(path.extname(filename).toLowerCase()) == -1
	#	cb 'non-allowed file type'
	#	return
	
	parser = mm stream
	
	parser.on 'metadata', (meta) ->
		pictures = meta.picture
		
		if pictures and pictures[0]

			type = typeToMime pictures[0].format
			
			if type != null
				cb null, type, meta.picture[0].data
				gotimg = true
		
		if !gotimg
			dir = path.dirname filename
			
			fs.readdir dir, (err, result) ->
				if err
					cb err
					return
				valid = ['.png', '.jpg', '.jpeg']
				commonFiles = ['cover', 'folder']
				result = result.filter (f) ->
					ext = path.extname(f).toLowerCase()
					valid.indexOf(ext) != -1
				img = null
				for file in result
					if img != null then break
					f = file.toLowerCase()
					if commonFiles.indexOf(path.basename(f, path.extname(f))) != -1
						img = file
					else
						for common in commonFiles
							if f.indexOf(common) != -1
								img = file
								break

				if img == null
					cb 'no image found\n'+JSON.stringify(meta)
				else
					fs.readFile path.join(dir, img), (err, data) ->
						if err
							cb err
						else
							cb null, typeToMime(path.extname(img).substr(1)), data

			#res.sendFile path.join(filename+'/../cover.jpg'),
			#	root: config.media_dir

	parser.on 'done', (err) ->
		stream.destroy()
		if err and !gotimg then cb err
	parser.on 'error', (err) ->
		stream.destroy()
		if err and !gotimg then cb err

	stream.on 'error', (err) ->
		if !gotimg
			cb err

htmloptions =
	root: __dirname + '/../dist/'
	dotfiles: 'deny'
	maxAge: 365*24*60*60*1000


module.exports = (app, passport, config, mpd, liquid, icecast) ->
	inDev = app.get('env') == 'development'

	internalRouter = express.Router()
	defaultRouter = express.Router()
	adminRouter = express.Router()


	internalRouter.post '/meta', (req, res) ->
		liquid.setMeta req.body
		res.end('ok')

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

	defaultRouter.get '/stream', (req, res) ->
		res.redirect config.streamurl


	defaultRouter.get '/login', (req, res) ->
		res.sendFile 'login.html', htmloptions

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
		user = req.user or {}
		json =
			username: user.username
			displayName: user.displayName
			image: user.image
		res.json json

	defaultRouter.get '/api/flash', (req, res) ->
		res.json req.flash()

	defaultRouter.get '/api/flash/:name', (req, res) ->
		res.json req.flash req.params.name

	defaultRouter.get '/api/now/art/:size', (req, res) ->
		size = req.params.size
		sizes = ['tiny', 'small', 'medium', 'full']
		if sizes.indexOf(size) == -1
			res.status(404).end('That image size was not found')
			return
		fs.readFile __dirname+'/../util/now/type.txt', (err, data) ->
			if err
				res.sendFile 'pr-cover-'+size+'.png', root: __dirname + '/../www/img/cover/'
			else
				if size == 'tiny'
					res.sendFile 'image-tiny.png', root: __dirname+'/../util/now/'
				else if size == 'small'
					res.sendFile 'image-small.png', root: __dirname+'/../util/now/'
				else if size == 'full'
					res.setHeader "Content-Type", data.toString()
					res.sendFile 'image-full', root: __dirname+'/../util/now/'
				else
					res.redirect 'full'
					#res.status(404).end('That image size was not found')

	defaultRouter.get '/api/now/json', (req, res) ->
		cors(res)
		res.setHeader "Content-Type", "application/json"
		res.sendFile 'json', root: __dirname+'/../util/now/'

	defaultRouter.get '/api/status', (req, res) ->
		cors(res)
		o =
			meta: liquid.getMeta()
			info: icecast.getInfo()
		res.json o

	defaultRouter.get '/api/icecast/json', (req, res) ->
		cors(res)
		res.setHeader "Content-Type", "application/json"
		json = icecast.getInfo()
		res.json json


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
		mpd.search type, query, (err, data) ->

			if err
				json = error: err
			else
				json = data

			res.json json

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


	adminRouter.get '/stream/*', (req, res) ->
		filename = cleanpath req.params[0]
		mpd.getTrackInfo filename, (err, info) ->
			if info and info.file == filename
				res.sendFile filename,
					root: config.media_dir
			else
				res.status(404).end('File not found in the music database')

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

	adminRouter.get '/api/queue/add/*', (req, res) ->
		filename = cleanpath req.params[0]
		liquid.queue.add filename, (err) ->
			if err
				json = error: err
			else
				json = error: null
			res.json json

	adminRouter.get '/api/announce/message/*', (req, res) ->
		liquid.announceMessage req.params[0], (err) ->
			if err
				json = error: err
			else
				json = error: null
			res.json json


	app.use '/', defaultRouter
	app.use '/dist/', express.static __dirname + '/../dist/', { maxAge: 365*24*60*60*1000 }

	if inDev
		app.use '/src/', express.static __dirname + '/../src/', { maxAge: 365*24*60*60*1000 }

	app.use '/', express.static __dirname + '/../www', { maxAge: 365*24*60*60*1000 }

	app.use '/internal/', isInternal, internalRouter
	app.use '/', isAdmin, adminRouter
