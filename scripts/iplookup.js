'use strict'

var config = require(__dirname+'/config')
var fetchJSON = require('./fetcher').fetchJSON

function iplookup(ip, cb) {
	fetchJSON('http://api.ipinfodb.com/v3/ip-city/?key='+config.ipinfodb.apiKey+'&ip='+ip+'&format=json&timestamp='+Date.now(), null, function (err, data) {
		if (err) {
			cb(err)
			return
		}

		if (data.latitude === 0 && data.longitude === 0) {
			data.found = false
		} else {
			data.found = true
		}

		cb(null, data)
	})
}

module.exports = iplookup
