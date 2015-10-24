'use strict'

var fetchJSON = require(__dirname+'/../../scripts/fetcher').fetchJSON

var utils = {

	fetchJSON: function (url, cb) {
		return fetchJSON(url, {}, cb)
	},

	handleAPI: function (url, cb) {
		utils.fetchJSON(url, function (err, data) {
			if (err) {
				console.error(url)
				utils.sayErr('handleAPI', 'I was not able to parse the url')
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
		var list = []
		for (var key in o) {
			if (o.hasOwnProperty(key) && key !== 'source' && o[key] !== null && o[key] !== undefined) {
				list.push(key+'='+JSON.stringify(o[key]))
			}
		}

		var out = ''
		if (list.length > 0) {
			out += 'annotate:'+list.join(',')+':'
		}
		out += o.source

		console.log(out)
	},

	sayErr: function (title, err) {
		return {
			title: title && title+' error',
			source: 'say:'+JSON.stringify(title+' error. '+err).replace(/\:/g, '.')
		}
	}

}

module.exports = utils
