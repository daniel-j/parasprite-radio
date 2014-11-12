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

typeToMime = (type) ->
	switch type
		when 'jpg' then type = 'image/jpeg'
		when 'jpeg' then type = 'image/jpeg'
		when 'png' then type = 'image/png'
		else type = null
	type



imageFromFile = (filename, cb) ->
	stream = fs.createReadStream filename
	gotimg = false
	allowed = ['.mp3', '.ogg', '.flac', '.wma']
	if allowed.indexOf(path.extname(filename).toLowerCase()) == -1
		cb 'non-allowed file type'
		return
	
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


module.exports = (app, passport, config, mpd) ->
	inDev = app.get('env') == 'development'

	defaultRouter = express.Router()
	adminRouter = express.Router()


	defaultRouter.get '/', (req, res) ->
		console.log req.session.cookie
		res.sendFile 'index.html', htmloptions


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





	adminRouter.get '/admin/*', (req, res) ->
		res.sendFile 'admin.html', htmloptions


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

	adminRouter.get '/api/albums', (req, res) ->
		mpd.getAlbums (err, albums) ->
			if err
				json = []
			else
				json = albums
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

	adminRouter.get '/api/files/*', (req, res) ->
		filename = cleanpath req.params[0]
		mpd.lsinfo filename, (err, list) ->
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

	adminRouter.get '/api/set/*', (req, res) ->
		filename = cleanpath req.params[0]
		imageFromFile path.join(config.media_dir, filename), (err, type, data) ->
			if err
				res.end ''+err
			else
				res.setHeader "Content-Type", type
				res.end data
		
		###id3 {file: config.media_dir+'/'+filename, type: id3.OPEN_LOCAL}, (err, tags) ->
			if err
				res.status(500).end err+''
			else

				if tags.v2 and tags.v2.image
					res.setHeader("Content-Type", tags.v2.image.mime);
					buffer = new Buffer(new Uint8Array(tags.v2.image.data));
					res.end buffer.toString('binary'), 'binary'
				else
					res.end 'no image data'###



	app.use '/', defaultRouter
	app.use '/js/', express.static __dirname + '/../dist/js/', { maxAge: 365*24*60*60*1000 }
	app.use '/style/', express.static __dirname + '/../dist/style/', { maxAge: 365*24*60*60*1000 }

	if inDev
		app.use '/src/', express.static __dirname + '/../src/', { maxAge: 365*24*60*60*1000 }

	app.use '/', express.static __dirname + '/../www', { maxAge: 365*24*60*60*1000 }

	app.use '/', isAdmin, adminRouter
