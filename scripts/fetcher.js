'use strict'

var urlparse = require('url').parse
var config = require(__dirname+'/config')

function fetcher(url, opt, callback) {
	if (typeof opt === 'function') {
		callback = opt
		opt = {}
	}
	opt = opt || {}
	var parsed = urlparse(url)
	var opts = {
		hostname: parsed.hostname,
		port: parsed.port,
		path: parsed.path,
		headers: {
			"user-agent": config.general.userAgent || "node"
		}
	}

	for (var k in opt) {
		opts[k] = opt[k]
	}

	var httpModule = parsed.protocol === 'https:' ? require('https') : require('http')
	httpModule.get(opts, function (res) {
		if (res.statusCode === 302 || res.statusCode === 301) {
			utils.fetchJSON.call(this, res.headers.location, callback)
			return
		}
		var data = []
		if (opt.stream) {
			callback(null, res)
		} else {
			res.on('data', function (chunk) {
				data.push(chunk)
			})

			res.on('end', function () {
				callback(null, Buffer.concat(data))
			})
		}

	}).on('error', function (e) {
		callback(e.message)
	})
}

function fetchJSON(url, opt, callback) {
	fetcher(url, opt, function (err, data) {
		if (err) {
			callback(err, data)
			return
		}
		try {
			var obj = JSON.parse(data)
		}
		catch (err) {
			callback(err, data)
			return
		}
		callback(null, obj)
	})
}

function fetchXML(url, opt, callback) {
	fetcher(url, opt, function (err, data) {
		if (err) {
			callback(err, data)
			return
		}
		var parser = require('xml2js')
		parser.parseString(data, callback)
	})
}

module.exports = {
	fetcher: fetcher,
	fetchJSON: fetchJSON,
	fetchXML: fetchXML
}
