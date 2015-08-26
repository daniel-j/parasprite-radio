'use strict'
var imageType = require('image-type')
var imageFromFile = require('./imageFromFile')
var fetcher = require('../../scripts/fetcher').fetcher
var lwip = require('lwip')

var imageFormats = {
	tiny: function (image) {
		return image.cover(80, 80)
	},
	small: function (image) {
		return image.cover(350, 350)
	}
}

function generateArt(input, cb) {
	if (!input) {
		cb(null, null)
		return
	}
	
	// the input is a remote image
	if (input.indexOf('http:') === 0 || input.indexOf('https:') === 0) {
		fetcher(input, null, function (err, data) {
			if (err) {
				cb(err)
				return
			}
			handleImageData(data, cb)
		})
	// input is path to a music file
	} else {
		imageFromFile(input, function (err, _type, data) {
			if (err) {
				cb(err)
				return
			}
			if (!data) {
				cb(null, null)
				return
			}
			handleImageData(data, cb)
		})
	}
}

function handleImageData(data, cb) {
	var type = imageType(data)
	// not an image
	if (!type) {
		cb(null, null)
		return
	}

	processImage(type, data, function (err, images) {
		if (err) {
			cb(err)
			return
		}
		var o = {
			original: data,
			type: type,
			sizes: images,
		}
		cb(null, o)
	})
}

function processImage(type, data, cb) {
	var totalCount = 0
	var c = 0
	var images = {}

	function loaded(name) {
		return function (err, image) {
			if (err) {
				console.error(err)
				done()
				return
			}
			var batchFunc = imageFormats[name]
			batchFunc(image.batch()).toBuffer('png', function (err, buffer) {
				if (err) {
					console.error(err)
					done()
					return
				}
				images[name] = buffer
				done()
			})
		}
	}

	function done() {
		c++
		if (c === totalCount) {
			cb(null, images)
		}
	}

	for (var name in imageFormats) {
		images[name] = null
		totalCount++
		lwip.open(data, type.ext, loaded(name))
	}
}

module.exports = generateArt
