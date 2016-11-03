
const fetchXML = require('../scripts/fetcher').fetchXML
import sse from './sse'
import config from '../scripts/config'

let interval = 5000

let ioUsers = 0
let viewers = 0
let online = false

function updateStats () {
  fetchXML(config.livestream.url_stats, null, function (err, data) {
    if (err) console.error('Livestream:', err)
    viewers = 0
    let isOnline = false
    try {
      let stream = data.rtmp.server[0].application[0].live[0].stream[0]
      let count = 0
      stream.client.forEach(function (client) {
        if ((client.flashver && client.flashver[0] !== 'ngx-local-relay') && !client.publishing) {
          count++
        }
      })
      // console.log(JSON.stringify(stream))
      isOnline = !!(stream.publishing && stream.active)
      if (isOnline) {
        viewers = count
      }
    } catch (e) { }

    online = isOnline

    sse.broadcast('livestreamstatus', {online: online, viewers: viewers + ioUsers}, true)

    // console.log(isOnline, viewers)
  })
}

const API = {
  initialize (io) {
    console.log('Initializing Livestream...')
    const ns = io.of('/livestream')

    ns.on('connection', (socket) => {
      // console.log('CONNECTION!!')
      ioUsers++
      sse.broadcast('livestreamstatus', {online: online, viewers: viewers + ioUsers}, true)

      socket.on('disconnect', () => {
        // console.log('disconnect!!!')
        ioUsers--
        sse.broadcast('livestreamstatus', {online: online, viewers: viewers + ioUsers}, true)
      })
    })

    sse.broadcast('livestreamstatus', {online: false, viewers: 0}, true)

    updateStats()
    setInterval(updateStats, interval)
  },

  getViewCount () {
    return viewers + ioUsers
  },

  isOnline () {
    return online
  },

  getInfo () {
    return {
      viewers: this.getViewCount(),
      online: this.isOnline()
    }
  }
}

export default API
