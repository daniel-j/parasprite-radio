'use strict'

var urlparse = require('url').parse
var config = require(__dirname+'/../../scripts/config')

var utils = {
	
	fetchJSON: function (url, callback) {
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
	},

	handleAPI: function (url, cb) {
		utils.fetchJSON(url, function (err, data) {
			if (err) {
				utils.sayErr("handleAPI", "I was not able to parse "+url)
			} else {
				cb(data)
			}
		})
	},

	formatter: function (o) {
		if (Array.isArray(o)) {
			o.forEach(utils.formatter)
			return
		}

		if (o.error) {
			o = utils.sayErr(o.what, o.error)
		}
		var list = [];
		for (var key in o) {
			if (o.hasOwnProperty(key) && key !== 'source' && o[key] !== null && o[key] !== undefined) {
				list.push(key+'='+JSON.stringify(o[key]))
			}
		}

		var out = "";
		if (list.length > 0) {
			out += "annotate:"+list.join(",")+":"
		}
		out += o.source

		console.log(out)
	},

	sayErr: function (title, err) {
		return {
			title: title && title+" error",
			source: "say:"+JSON.stringify(title+" error. "+err).replace(/\:/g, '.')
		}
	}

}

module.exports = utils
