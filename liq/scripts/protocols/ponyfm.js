'use strict'

const utils = require('../utils')

let root = 'https://pony.fm'

function protocol (arg, parsedUrl, handleCb) {
  var path = parsedUrl.pathname.substr(1).split('/')

  if (path[0] === 'tracks') {
    utils.handleAPI(root + '/api/web/tracks/' + parseInt(path[1]) + '?log=true', outputTrack) // log=true adds to viewcount
  }

  function outputTrack (info) {
    var track = info.track
    var id = track.id
    var arturl = track.covers.normal
    var year = parseInt(track.published_at.date, 10) // format: '2015-04-18 05:33:53.000000'

    var audiourl = root + '/t' + id + '/dl.mp3'

    handleCb({
      title: track.title,
      artist: track.user.name,
      url: track.url,
      art: arturl,
      duration: track.duration,
      year: year,

      source: audiourl
    })
  }
}

protocol.title = 'PonyFM'

module.exports = protocol
