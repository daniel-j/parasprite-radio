'use strict'

var fs = require('fs')
var path = require('path')
var mm = require('musicmetadata')

function typeToMime(type) {

	switch (type) {
		case 'jpg': type = 'image/jpeg'; break
		case 'jpeg': type = 'image/jpeg'; break
		case 'png': type = 'image/png'; break
		default: type = null; break
	}
	return type
}

function imageFromFile(filename, cb) {
	var stream = fs.createReadStream(filename)
	var gotimg = false
	//allowed = ['.mp3', '.ogg', '.flac', '.wma']
	//if allowed.indexOf(path.extname(filename).toLowerCase()) == -1
	//	cb 'non-allowed file type'
	//	return

	var parser = mm(stream, {}, function (err, meta) {
		var pictures = meta.picture

		if (pictures && pictures[0]) {

			var type = typeToMime(pictures[0].format)

			if (type !== null) {
				cb(null, type, meta.picture[0].data)
				gotimg = true
			}
		}

		if (!gotimg) {
			var dir = path.dirname(filename)

			fs.readdir(dir, function (err, result) {
				if (err) {
					cb(err)
					return
				}
				var valid = ['.png', '.jpg', '.jpeg']
				var commonFiles = ['cover', 'folder', 'album', 'artist', 'art']
				result = result.filter(function (f) {
					var ext = path.extname(f).toLowerCase()
					return valid.indexOf(ext) !== -1
				})
				var img = null
				for (var i = 0; i < result.length; i++) {
					var file = result[i]
					if (img !== null) break
					var f = file.toLowerCase()
					if (commonFiles.indexOf(path.basename(f, path.extname(f))) !== -1) {
						img = file
					}
					else {
						for (var j = 0; j < commonFiles.length; j++) {
							var common = commonFiles[j]
							if (f.indexOf(common) !== -1) {
								img = file
								break
							}
						}
					}
				}

				if (img == null) {
					// no image was found
					cb(null, null, null)
				}
				else {
					fs.readFile(path.join(dir, img), function (err, data) {
						if (err) {
							cb(err)
						}
						else {
							cb(null, typeToMime(path.extname(img).substr(1)), data)
						}
					})
				}
			})
		}
	})

	parser.on('done', function (err) {
		stream.destroy()
		if (err && !gotimg)
			cb(err)
	})
	parser.on('error', function (err) {
		stream.destroy()
		if (err && !gotimg)
			cb(err)
	})

	stream.on('error', function (err) {
		if (!gotimg)
			cb(err)
	})
}

module.exports = imageFromFile
