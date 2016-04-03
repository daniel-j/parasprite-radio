
var fetchXML = require('../scripts/fetcher').fetchXML
var sse = require('./sse')

var interval = 5000

module.exports = function (config, io) {

	var ns = io.of('/livestream')
	var ioUsers = 0

	var stats = null
	var viewers = 0
	var online = false

	sse.broadcast('livestreamstatus', {online: false, viewers: 0}, true)

	function updateStats() {
		fetchXML(config.livestream.url_stats, null, function (err, data) {
			viewers = 0
			var isOnline = false
			try {
				var stream = data.rtmp.server[0].application[0].live[0].stream[0]
				stats = stream
				var count = 0
				stream.client.forEach(function (client) {
					if ((client.flashver && client.flashver[0] !== 'ngx-local-relay') && !client.publishing) {
						count++
					}
				})
				//console.log(JSON.stringify(stream))
				isOnline = !!(stream.publishing && stream.active)
				if (isOnline) {
					viewers = count
				}
			}
			catch (e) {
				stats = null
			}

			online = isOnline

			sse.broadcast('livestreamstatus', {online: online, viewers: viewers+ioUsers}, true)

			//console.log(isOnline, viewers)
		})
	}

	updateStats()
	setInterval(updateStats, interval)

	ns.on('connection', function (socket) {
		//console.log('CONNECTION!!')
		ioUsers++
		sse.broadcast('livestreamstatus', {online: online, viewers: viewers+ioUsers}, true)

		socket.on('disconnect', function () {
			//console.log('disconnect!!!')
			ioUsers--
			sse.broadcast('livestreamstatus', {online: online, viewers: viewers+ioUsers}, true)
		})
	})


	API = {

		getViewCount() {
			return viewers+ioUsers
		},

		isOnline() {
			return online
		},

		getInfo() {
			return {
				viewers: this.getViewCount(),
				online: this.isOnline()
			}
		}
	}

	return API
}