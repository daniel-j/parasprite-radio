
const fetchXML = require('../scripts/fetcher').fetchXML
const sse = require('./sse')

let interval = 5000

module.exports = function (config, io) {
  let ns = io.of('/livestream')
  let ioUsers = 0

  let viewers = 0
  let online = false

  sse.broadcast('livestreamstatus', {online: false, viewers: 0}, true)

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

  updateStats()
  setInterval(updateStats, interval)

  ns.on('connection', function (socket) {
    // console.log('CONNECTION!!')
    ioUsers++
    sse.broadcast('livestreamstatus', {online: online, viewers: viewers + ioUsers}, true)

    socket.on('disconnect', function () {
      // console.log('disconnect!!!')
      ioUsers--
      sse.broadcast('livestreamstatus', {online: online, viewers: viewers + ioUsers}, true)
    })
  })

  const API = {
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

  return API
}
