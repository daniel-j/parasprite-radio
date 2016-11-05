'use strict'

// to be able to include ES6 modules
require('babel-core/register')({
  plugins: [
    'transform-es2015-modules-commonjs',
    'syntax-async-functions',
    'transform-async-to-generator'
  ]
})

const scrapeIt = require('scrape-it')
const vm = require('vm')
const mpd = require('../../../server/mpd').default
const config = require('../../../scripts/config')

function protocol (arg, parsedUrl, handleCb) {
  let path = parsedUrl.pathname.substr(1).split('/')
  if (path[0] === 'track') {
    scrapeIt(parsedUrl.href, {
      // title: 'h2.trackTitle',
      // comment: '#trackInfo .tralbumData.tralbum-about',
      // lyrics: '#trackInfo .tralbumData.lyricsText',
      albumartist: 'h3.albumTitle span[itemprop="byArtist"]',
      album: 'h3.albumTitle span[itemprop="inAlbum"] a span',
      // artisturl: {
      //   selector: 'h3.albumTitle span[itemprop="byArtist"] a',
      //   attr: 'href'
      // },
      code: '#pgBd script:nth-child(3)',
      art: {
        selector: '#tralbumArt a.popupImage img',
        attr: 'src'
      }
    }).then((page) => {
      let code = page.code.substring(page.code.indexOf('\nvar Tralb' + 'umData = {'))
      code = code.substring(0, code.indexOf('\nvar Paym' + 'entData = {'))
      const sandbox = {}
      const script = vm.createScript(code)
      const context = vm.createContext(sandbox)
      script.runInContext(context)

      const data = sandbox.TralbumData
      const track = data.trackinfo[0]
      let title = data.current.title
      let artist = data.current.artist || data.artist
      let album = page.album || null
      let albumartist = album && page.albumartist || null
      let url = data.url
      let duration = track.duration || null
      let art = page.art || null
      let comment = ((data.current.about || '') + '\n\n' + (data.current.credits || '')).trim() || null
      let year = new Date(data.current.release_date || data.current.publish_date || '').getFullYear() || null
      let source = track.file['mp3-128'].replace(/^\/\//, 'https://') + '&liquidtype=.mp3'

      mpd.enableLogging(false)

      mpd.find({
        title: title,
        artist: artist,
        album: album,
        albumartist: albumartist
      }).then((tracks) => {
        mpd.disconnect()

        let found = null
        for (let i = 0; i < tracks.length; i++) {
          let t = tracks[i]
          if ((year !== null && t.date === year) && (t.time === Math.round(duration))) {
            found = t
            break
          }
        }

        if (found) {
          handleCb({
            source: config.general.media_dir + '/' + found.file,
            comment: comment,
            url: url
          })
        } else {
          handleCb({
            title: title,
            artist: artist,
            album: album,
            albumartist: albumartist,
            url: url,
            duration: duration,
            art: art,
            comment: comment,
            year: year,

            source: source
          })
        }
      })
    })
  }
}

protocol.title = 'bandcamp'

module.exports = protocol
