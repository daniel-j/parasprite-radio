#!/usr/bin/env node
'use strict'
const exec = require('child_process').exec
const path = require('path')
const mediainfo = require('mediainfoq')

let output = {}
let extensions = ['mod', 's3m', 'xm', 'it', 'j2b']
let ext = path.extname(process.argv[2]).substr(1)
let name = path.basename(process.argv[2])

// prevents mediainfo from crashing
// LC_ALL and LANG are set to C by Liquidsoap. But why?
delete process.env.LC_ALL
process.env.LANG = 'en_US.UTF-8' // I hope your system has this locale

mediainfo(process.argv[2]).then(function (res) {
  // delete res[0].cover_data
  // console.error(res[0])

  if (res[0].track_name) {
    output.title = res[0].track_name
  }
  if (res[0].performer) {
    output.artist = res[0].performer
  }
  if (res[0].album) {
    output.album = res[0].album
  }
  if (res[0].album_performer) {
    output.albumartist = res[0].album_performer
  }
  if (res[0].recorded_date) {
    output.year = parseInt(res[0].recorded_date, 10)
  }
  if (res[0].genre) {
    output.genre = res[0].genre
  }
  if (res[0].overall_bit_rate) {
    output.bitrate = parseInt(res[0].overall_bit_rate.replace(/\s/g, ''), 10)
  }
  if (res[0].overall_bit_rate_mode) {
    output.bitrate_mode = res[0].overall_bit_rate_mode.toLowerCase()
  }
  if (res[0].duration) {
    console.error(res[0].duration)
    var d = res[0].duration.match(/^(?:(\d*) h)?\s?(?:(\d*) mi?n)?\s?(?:(\d*) s)?\s?(?:(\d*) ms)?$/)
    if (d) {
      var duration = Math.round((d[1] || 0) * 60 * 60 + (d[2] || 0) * 60 + (d[3] || 0) * 1 + (d[4] || 0) * 0.001)
      if (duration > 0) {
        output.duration = duration
      }
    }
  }
  // convert everything to string, because Liquidsoap
  for (var key in output) {
    output[key] = '' + output[key]
  }
  console.log(JSON.stringify(output))
}).catch(function (err) {
  console.error('Mediainfo ' + err.error)

  if (extensions.indexOf(ext.toLowerCase()) !== -1) {
    output.title = name

    exec('file ' + JSON.stringify(process.argv[2]), function (err, stdout, stderr) {
      if (err) {
        console.error(err)
        console.log(JSON.stringify(output))
        return
      }
      // console.log(stderr)
      var m = stdout.trim().match(/"([^"]*)"/) || []
      var title = m[1] || ''
      var pos = title.indexOf('\\032')
      if (pos !== -1) title = title.substring(0, pos)
      title = title.trim()
      if (title.length > 0) {
        output.title = title
      }

      console.log(JSON.stringify(output))
    })
  } else {
    console.log(JSON.stringify(output))
  }
})
