
import { fetchXML } from '../scripts/fetcher'
import sse from './sse'
import config from '../scripts/config'
import { streamInfo } from './streams'
import { execFile } from 'child_process'
import path from 'path'

let interval = 5000

let viewers = 0
let online = false
let encoders = new Map()

function updateStats () {
  fetchXML(config.livestream.url_stats, null, (err, data) => {
    if (err) console.error('Livestream:', err)
    viewers = 0
    let isOnline = false
    try {
      let streams = data.rtmp.server[0].application[0].live[0].stream
      let stream
      for (let i = 0; i < streams.length; i++) {
        if (streams[i].name[0] === config.livestream.name) {
          stream = streams[i]
          break
        }
      }
      let count = 0
      stream.client.forEach((client) => {
        if ((client.flashver && client.flashver[0] !== 'ngx-local-relay') && !client.publishing) {
          count++
        }
      })
      isOnline = !!(stream.publishing && stream.active)
      if (isOnline) {
        viewers = count
      }
    } catch (e) {

    }

    online = isOnline

    sse.broadcast('livestreamstatus', API.getInfo(), true)

    if (online) {
      API.publishStart(config.livestream.name)
    } else {
      API.publishStop(config.livestream.name)
    }
  })
}

const API = {
  initialize () {
    console.log('Initializing Livestream...')

    sse.broadcast('livestreamstatus', API.getInfo(), true)

    updateStats()
    setInterval(updateStats, interval)
  },

  getViewCount () {
    return Math.max(0, viewers + streamInfo.livestream.length - 1)
  },

  isOnline () {
    return online
  },

  getInfo () {
    return {
      viewers: this.getViewCount(),
      online: this.isOnline()
    }
  },

  publishStart (streamName) {
    if (encoders.has(streamName)) return
    console.log('Livestream: Starting HLS encoder')
    let child = execFile(path.join(__dirname, '../scripts/livestream.sh'), [config.server.streams_dir, streamName], (err, stdout, stderr) => {
      if (err) console.error('Livestream: HLS encoder error:', err)
      if (stdout) console.log(stdout)
      if (stderr) console.error(stderr)
      console.log('Livestream: HLS encoder stopped')
      encoders.delete(streamName)
    })
    encoders.set(streamName, child)
  },
  publishStop (streamName) {
    if (!encoders.has(streamName)) return
    console.log('Livestream: Stopping HLS encoder')
    let child = encoders.get(streamName)
    encoders.delete(streamName)
    child.kill('SIGINT')
  },
  viewerChange (streamName, delta) {
    // TODO
  }
}

export default API
