
const spawn = require('child_process').spawn
const pify = require('pify')
const parseString = require('xml2js').parseString

module.exports = async function () {
  let files = Array.prototype.slice.apply(arguments)

  // execute mediainfo and get XML output
  let child = spawn(
    'mediainfo',
    ['--Output=XML', '--Language=Raw', '--Full'].concat(files),
    {stdio: ['ignore', 'pipe', process.stderr]}
  )
  let bufs = []
  child.stdout.on('data', (d) => bufs.push(d))
  let output = await new Promise((resolve, reject) => {
    child.stdout.once('end', () => {
      resolve(Buffer.concat(bufs))
    })
  })

  let tracks = [] // hold all tracks JSON object

  let result = await pify(parseString)(output)
  result.Mediainfo.File.forEach((fileObj) => {
    let tmpTrack
    let trackList = [] // hold track JSON in list
    let trackJSON = {} // hold individual track JSON data
    fileObj.track.forEach((trackObj) => {
      let tmpTrackJSON = {}
      for (let key in trackObj) {
        if (key !== "_" & key !== '$') {
          tmpTrackJSON[key.toLowerCase()] = trackObj[key][0]
        } else if (key === '$') {
          tmpTrackJSON['type'] = trackObj['$'].type
        }
      }
      // for General put details outside
      if (tmpTrackJSON.type !== 'General') {
        trackList.push(tmpTrackJSON)
      } else {
        tmpTrack = tmpTrackJSON
      }
    })

    trackJSON['tracks'] = trackList

    for (let key in tmpTrack) {
      // don't want type for General details
      if (key !== 'type') {
        trackJSON[key] = tmpTrack[key]
      }
    }
    tracks.push(trackJSON)
  })
  return tracks
}
