#!/usr/bin/env node
'use strict'
var child_process = require('child_process')
var path = require('path')
var mediainfo = require("mediainfoq")

var output = {}
var xmp_ext = ['mod','s3m','xm','it','j2b']
var ext = path.extname(process.argv[2]).substr(1)
var name = path.basename(process.argv[2])

mediainfo(process.argv[2]).then(function (res) {
	if (res[0].track_name) {
		output.title = res[0].track_name
	}
	if (res[0].performer) {
		output.artist = res[0].performer
	}
	console.log(JSON.stringify(output))
}).catch(function (err) {
	if (xmp_ext.indexOf(ext.toLowerCase()) !== -1) {
		output.title = name

		child_process.exec('file '+JSON.stringify(process.argv[2]), function (err, stdout, stderr) {
			if (err) {
				console.error(err)
				console.log(JSON.stringify(output))
				return
			}
			//console.log(stderr)
			var m = stdout.trim().match(/"([^"]*)"/) || []
			var title = m[1] || ''
			var pos = title.indexOf('\\032')
			if (pos !== -1) title = title.substring(0, pos)
			title = title.trim()
			if (title.length > 0) {
				output.title = title
			}

			console.log(JSON.stringify(output))
		})
	} else {
		console.log(JSON.stringify(output))
	}
})
