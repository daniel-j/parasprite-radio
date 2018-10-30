'use strict'

const spawn = require('child_process').spawn
const os = require('os')

function protocol (arg, parsedUrl, handleCb) {
  let yt = spawn('youtube-dl', ['--no-playlist', '--playlist-end', 1, '-j', '-f', '251/opus/vorbis/bestaudio/best', arg])

  let output = ''

  yt.stdout.on('data', function (chunk) {
    output += chunk.toString('utf8')
  })
  yt.on('close', function () {
    let data = JSON.parse(output)
    delete data.formats
    fetchVideo(data, handleCb)
  })
}

function fetchVideo (data, cb) {
  console.error('audio codec:', data.acodec)
  if (data.acodec !== 'mp3' || data.vcodec !== 'none') {
    let tempName = os.tmpdir() + '/tmp.yt.' + data.id + '.ogg'

    // let ffmpeg = spawn('avconv', ['-i', data.url, '-codec:a', 'libmp3lame', '-q:a', 2, '-y', '-vn', '-f', 'mp3', tempName])
    // joint stereo VBR2 mp3
    //let ffmpeg = spawn('ffmpeg', ['-hide_banner', '-i', data.url, '-codec:a', 'libmp3lame', '-q:a', 2, '-joint_stereo', 1, '-y', tempName])
    let ffmpeg = spawn('ffmpeg', ['-hide_banner', '-i', data.url, '-codec:a', 'copy', '-y', tempName])

    ffmpeg.stdout.pipe(process.stderr)
    ffmpeg.stderr.pipe(process.stderr)
    data.filename = data.url + '&liquidtype=.ogg'
    data.filename = tempName
    // console.error('Downloading ' + data.title + '...')

    // ffmpeg.on('close', function () {
    // })
  } else {
    data.filename = data.url + '&liquidtype=.mp3'
  }

  outputVideo(data, cb)
}

function outputVideo (video, cb) {
  // let url = video.url.replace(/\./g, '%2E')
  // url += '&filename=' + encodeURIComponent('v.'+video.ext)

  cb({
    title: video.title,
    artist: video.uploader,
    url: video.webpage_url,
    art: video.thumbnail,
    temporary: true,

    source: video.filename
  })
}

protocol.title = 'youtube-dl'

module.exports = protocol
