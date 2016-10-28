'use strict'

const path = require('path')
const config = require(path.join(__dirname, 'config'))
const fetchJSON = require('./fetcher').fetchJSON

function iplookup (ip, cb) {
  if (!config.ipinfodb.apiKey) {
    cb('no ipinfodb api key')
    return
  }
  fetchJSON('http://api.ipinfodb.com/v3/ip-city/?key=' + config.ipinfodb.apiKey + '&ip=' + ip + '&format=json&timestamp=' + Date.now(), null, function (err, data) {
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
