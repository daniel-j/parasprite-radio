'use strict'

const path = require('path')
const fetchJSON = require(path.join(__dirname, '../../scripts/fetcher')).fetchJSON

const utils = {
  fetchJSON (url, cb) {
    return fetchJSON(url, {}, cb)
  },

  handleAPI (url, cb) {
    utils.fetchJSON(url, function (err, data) {
      if (err) {
        console.error(url)
        utils.sayErr('handleAPI', 'I was not able to parse the url')
      } else {
        cb(data)
      }
    })
  },

  formatter (o) {
    if (Array.isArray(o)) {
      o.forEach(utils.formatter)
      return
    }

    if (o.error) {
      o = utils.sayErr(o.what, o.error)
    }
    let list = []
    for (let key in o) {
      if (o.hasOwnProperty(key) && key !== 'source' && o[key] !== null && o[key] !== undefined) {
        list.push(key + '=' + JSON.stringify(o[key]))
      }
    }

    let out = ''
    if (list.length > 0) {
      out += 'annotate:' + list.join(',') + ':'
    }
    out += o.source

    console.log(out)
  },

  sayErr (title, err) {
    return {
      title: title && title + ' error',
      source: 'say:' + JSON.stringify(title + ' error. ' + err).replace(/:/g, '.')
    }
  }
}

module.exports = utils
