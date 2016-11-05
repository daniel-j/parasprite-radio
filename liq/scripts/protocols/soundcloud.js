'use strict'

const utils = require('../utils')
const path = require('path')
const config = require(path.join(__dirname, '../../../scripts/config'))

let root = 'https://api.soundcloud.com'

function protocol (arg, parsedUrl, handleCb) {
  if (!config.soundcloud.clientId) {
    handleCb(null)
    return
  }
  utils.handleAPI(root + '/resolve.json?url=' + encodeURIComponent(process.argv[2]) + '&client_id=' + config.soundcloud.clientId, checkTrack)

  function checkTrack (response) {
    if (response.kind === 'playlist') {
      response.tracks.forEach(outputTrack)
    } else if (response.kind === 'track') {
      outputTrack(response)
    } else {
      handleCb({what: protocol.title, error: 'Not a track, ' + response.kind})
      return
    }
  }

  function outputTrack (track) {
    let arturl = track.artwork_url || track.user.avatar_url || ''
    arturl = arturl.replace('large', 't500x500')
    let year = parseInt(track.created_at, 10) // format: '2015/04/22 22:12:30 +0000'
    let audiourl = ''
    let format = 'mp3'
    if (track.downloadable && track.original_format !== 'wav') {
      audiourl = track.download_url
      format = track.original_format
    } else if (track.streamable) {
      audiourl = track.stream_url
    } else {
      handleCb({what: protocol.title, error: 'No stream url found.'})
      return
    }
    audiourl += '?client_id=' + config.soundcloud.clientId + '&liquidformat=.' + format

    handleCb({
      title: track.title,
      artist: track.user.username,
      url: track.permalink_url,
      art: arturl || null,
      duration: Math.round(track.duration / 1000),
      year: year,

      source: audiourl
    })
  }
}

protocol.title = 'Soundcloud'

module.exports = protocol
