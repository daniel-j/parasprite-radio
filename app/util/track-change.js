#!/usr/bin/env node
'use strict'

var fs = require('fs')
var path = require('path')
var mm = require('musicmetadata')
var lwip = require('lwip')

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
					cb('no image found\n'+JSON.stringify(meta))
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

			//res.sendFile path.join(filename+'/../cover.jpg'),
			//	root: config.media_dir
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


var liq = JSON.parse(process.argv[2])

console.log(liq)

var json = {
	title: liq.title || path.basename(liq.filename, path.extname(liq.filename)),
	artist: liq.artist || null,
	album: liq.album || null,
	albumartist: liq.albumartist || null,
	url: liq.url || null,
	year: +liq.year || null,
	art: liq.art || null
}

fs.writeFile(__dirname+'/now/json', JSON.stringify(json), 'utf8')

if (!liq.art && liq.filename) {
	console.log("Generating art...")
	imageFromFile(liq.filename, function (err, type, data) {
		if (err) {
			console.log("Failed to generate art! "+err)
			fs.unlink(__dirname+'/now/image-full', function () {})
			fs.unlink(__dirname+'/now/image-small.png', function () {})
			fs.unlink(__dirname+'/now/image-tiny.png', function () {})
			fs.unlink(__dirname+'/now/type.txt', function () {})
		}
		else {

			fs.writeFile(__dirname+'/now/image-full', data, function (err) {
				if (err) throw err
				console.log("Saved full art")
			})
			fs.writeFile(__dirname+'/now/type.txt', type)

			var t = type.split('/')[1] === 'png' ? 'png':'jpg'
			lwip.open(data, t, function (err, image) {
				if (err) console.log(err)
				else {
					image.batch()
						.cover(80, 80)
						.writeFile(__dirname+'/now/image-tiny.png', function (err) {
							if (err) throw err
							console.log("Saved tiny art")
						})
				}
			})
			lwip.open(data, t, function (err, image) {
				if (err) console.log(err)
				else {
					image.batch()
						.cover(350, 350)
						.writeFile(__dirname+'/now/image-small.png', function (err) {
							if (err) throw err
							console.log("Saved small art")
						})
				}
			})
		}
	})
}
