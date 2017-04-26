
import token from './utils/token'
import iplookup from '../scripts/iplookup'
import config from '../scripts/config'

let streamConnections = new Map()
let streamInfo = {radio: [], livestream: []}
let ipcache = new Map()

function radioPlaylist (req, res) {
  let t = token.generate()
  res.type('m3u8')
  res.send(`#EXTM3U
#EXT-X-STREAM-INF:PROGRAM-ID=1, BANDWIDTH=256000
hls/radio/high.m3u8?t=${t}
#EXT-X-STREAM-INF:PROGRAM-ID=1, BANDWIDTH=96000
hls/radio/medium.m3u8?t=${t}
#EXT-X-STREAM-INF:PROGRAM-ID=1, BANDWIDTH=48000
hls/radio/low.m3u8?t=${t}
`)
}

function livestreamPlaylist (req, res) {
  let t = token.generate()
  res.type('m3u8')
  res.send(`#EXTM3U
#EXT-X-STREAM-INF:PROGRAM-ID=1, BANDWIDTH=1000000
hls/livestream/${config.livestream.name}.m3u8?t=${t}
`)
}

function handleRequest (req, res, next) {
  let t = req.query.t
  let m = req.path.match(/\/(.*)\/(.*)\/(.*)\.m3u8/)
  if (t && m) {
    let tech = m[1]
    let type = m[2]
    let format = m[3]
    let ip = req.ips[0]
    let agent = req.get('User-Agent')
    let o = streamConnections.get(t)
    let connected = o ? o._connected : Date.now()
    streamConnections.set(t, {
      ip: ip,
      format: format,
      type: type,
      tech: tech,
      agent: agent || 'Unknown',
      _updated: Date.now(),
      _connected: connected
    })
    addIP(ip)
  }
  next()
}

function updateStreamInfo () {
  let now = Date.now()
  streamInfo.radio.length = 0
  streamInfo.livestream.length = 0
  streamConnections.forEach((info, t) => {
    if (info._updated < now - 5000) {
      streamConnections.delete(t)
      return
    }
    if (streamInfo.hasOwnProperty(info.type)) {
      streamInfo[info.type].push({
        connected: info._connected,
        ip: info.ip,
        format: info.format,
        userAgent: info.agent,
        type: info.type,
        location: ipcache.get(info.ip) || null,
        mount: info.type + '_' + info.tech
      })
    }
  })
}

function addIP (ip) {
  let now = Date.now()
  if (ipcache.has(ip) && now < ipcache.get(ip)._time + 1 * 60 * 60 * 1000) {
    // ip is already in cache and does not need to be looked up up again
    return
  }
  ipcache.set(ip, {
    _time: Date.now(),
    found: false
  })
  iplookup(ip, (err, info) => {
    if (!err && info.found) {
      info._time = Date.now()
      ipcache.set(ip, info)
    }
  })
}

function initialize () {
  console.log('Initializing Streams...')
  setInterval(updateStreamInfo, 5000)
}

function getStreamInfo () {
  let list = []

  function handleStream (o) {
    let loc = o.location
    if (loc) {
      list.push({
        ip: o.ip,
        location: {
          lng: loc.longitude,
          lat: loc.latitude,
          countryCode: loc.countryCode,
          countryName: loc.countryName,
          regionName: loc.regionName,
          cityName: loc.cityName,
          timezone: loc.timeZone
        },
        type: o.type,
        mount: o.mount,
        connected: Math.floor(o.connected / 1000),
        userAgent: o.userAgent
      })
    }
  }

  streamInfo.radio.forEach(handleStream)
  streamInfo.livestream.forEach(handleStream)

  return list
}

export { initialize, handleRequest, radioPlaylist, livestreamPlaylist, streamInfo, getStreamInfo }
