'use strict'

var utils = {
	
	fetchJSON: function (url, callback, httpModule) {
		if (!httpModule) httpModule = require('http')
		httpModule.get(url, function (res) {
			if (res.statusCode === 302) {
				utils.fetchJSON.call(this, res.headers.location, callback, httpModule)
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
					callback(err)
					return
				}
				callback(null, obj)
			})

		}).on('error', function (e) {
			callback(e.message)
		})
	},

	handleAPI: function (url, cb, httpModule) {
		if (!httpModule) httpModule = require('http')
		utils.fetchJSON(url, function (err, data) {
			if (err) {
				utils.sayErr("handleAPI", "I was not able to parse "+url)
			} else {
				cb(data)
			}
		}, httpModule)
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
