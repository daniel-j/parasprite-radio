'use strict'

var urlparse = require('url').parse
var config = require(__dirname+'/config')

function fetchJSON(url, callback) {
	var parsed = urlparse(url)
	var opts = {
		host: parsed.host,
		path: parsed.path,
		headers: {
			"user-agent": config.general.userAgent || "node"
		}
	}
	var httpModule = parsed.protocol === 'https:' ? require('https') : require('http')
	httpModule.get(opts, function (res) {
		if (res.statusCode === 302) {
			utils.fetchJSON.call(this, res.headers.location, callback)
			return
		}
		var data = ''

		res.on('data', function (chunk) {
			data += chunk
		})

		res.on('end', function () {
			try {
				var obj = JSON.parse(data)
			}
			catch (err) {
				callback(err, data)
				return
			}
			callback(null, obj)
		})

	}).on('error', function (e) {
		callback(e.message)
	})
}
module.exports = fetchJSON
