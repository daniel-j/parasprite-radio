
import http from 'http'
import { fetchXML } from '../scripts/fetcher'
import iplookup from '../scripts/iplookup'
import sse from './sse'

let timeout = 5000


export default function (config) {

	let servers = {}
	let iceData = {}
	let listenerDetailed = []
	let lastListenerCount = 0
	let listenerPeak = 0
	let ipcache = {}
	let isUpdatingDetailed = false

	sse.broadcast('listenercount', 0, true)
	sse.broadcast('icecaststatus', {online: false}, true)

	config.icecast.host = config.icecast.host || 'localhost'
	config.icecast.port = config.icecast.port || 8000
	config.icecast.user = config.icecast.user || 'admin'
	config.icecast.admin.password = config.icecast.admin.password || 'hackmemore'

	let masterServer = servers[config.icecast.host+':'+config.icecast.port] = {
		host: config.icecast.host,
		port: config.icecast.port,
		user: config.icecast.admin.user,
		password: config.icecast.admin.password,
		relay: false
	}


	let relays = config.icecast.relay || []
	for (let relay of relays) {
		relay.host = relay.host || 'localhost'
		relay.port = relay.port || 8000
		relay.user = relay.user || config.icecast.admin.user
		relay.password = relay.password || config.icecast.admin.password
		relay.relay = true

		let k = relay.host+':'+relay.port
		if (!servers[k]) {
			servers[k] = relay
		}
	}

	function handleServer(server) {
		let stats = {}
		let k = server.host+':'+server.port
		iceData[k] = stats

		let iceReady = false
		let client = null
		let isMaster = server === masterServer

		function iceOnReady() {
			console.log('Icecast: Ready!')
			iceReady = true
			if (isMaster) {
				sse.broadcast('icecaststatus', {online: true}, true)
			}
		}

		function iceOnEvent(ev) {
			let data = ev.match(/^[^ ]* ([^ ]*) ([^ ]*) (.*)$/)
			if (!data) {
				return
			}

			let scope = data[1]
			let key = data[2]
			let value = data[3]
			if (!stats[scope]) {
				stats[scope] = {}
			}
			stats[scope][key] = value
			if (value === 'null') {
				delete stats[scope][key]
			}
			if (key === 'null') {
				delete stats[scope]
			}
			let count = API.getListenerCount()

			if (config.icecast.mounts.indexOf(scope.substr(1)) !== -1 && key === 'listener_peak' && stats[scope][key] > listenerPeak) {
				listenerPeak = +stats[scope][key]
			}
			if (count > listenerPeak) {
				listenerPeak = count
			}

			if (count !== lastListenerCount) {
				// more listeners!
				if (count > lastListenerCount) {
					updateListenerInfo()
				}
				lastListenerCount = count
				console.log('listener count: '+count)
				sse.broadcast('listenercount', count, true)
			}
		}

		function iceOnError(err) {
			console.error('Icecast: Socket error: '+err)
			client = null
			iceReady = false
			iceData[k] = stats = {}

			if (isMaster) {
				sse.broadcast('icecaststatus', {online: false}, true)
			}

			setTimeout(iceConnect, timeout)
		}

		function iceOnEnd() {
			console.log('Icecast: Socket ended')
			client = null
			iceReady = false
			iceData[k] = stats = {}
			if (isMaster) {
				sse.broadcast('icecaststatus', {online: false}, true)
			}

			setTimeout(iceConnect, timeout)
		}

		function iceConnect() {
			if (client) {
				return
			}

			let opts = {
				method: 'STATS',
				host: server.host,
				port: server.port,
				auth: server.user+':'+server.password
			}

			client = http.request(opts, function (res) {
				if (res.statusCode === 200) {
					res.on('data', (chunk) => {
						let s = chunk.toString().trim()
						let a = s.split('\n')
						for (let ev of a) {
							iceOnEvent(ev)
						}
					})
					res.once('end', iceOnEnd)
					res.once('error', iceOnError)
					iceOnReady()
				} else {
					res.end && res.end()
					iceOnError(res.statusCode)
				}
			}).on('error', iceOnError)
			client.end()

			console.log('Icecast: Connecting to '+k+'..')
		}

		iceConnect()
	}

	function getLocations(list, cb) {
		let i = 0
		function recursive() {
			let listener = list[i]
			if (!listener) {
				// done
				cb && cb()
				return
			}
			let now = Date.now()
			let ip = listener.ip
			if (!ipcache[ip] || now > ipcache[ip]._time+1*60*60*1000) { // 1 hour cache
				//console.log('Performing IP lookup of '+ip)
				iplookup(ip, function (err, info) {
					//console.log('IP lookup of '+ip+':', info.countryName)
					if (!err && info.found) {
						info._time = Date.now()
						ipcache[ip] = info
						listener.location = info
					} else {
						listener.location = null
						delete ipcache[ip]
					}
					i++
					recursive()
				})
			} else {
				listener.location = ipcache[ip]
				i++
				recursive()
			}
		}
		recursive()
	}

	function updateListenerInfo(cb) {
		if (isUpdatingDetailed) {
			return
		}
		isUpdatingDetailed = true
		let list = []
		let mounts = config.icecast.mounts
		let mi = 0
		function recursive() {
			let m = mounts[mi]
			if (!m) {
				// done
				getLocations(list, function () {
					isUpdatingDetailed = false
					listenerDetailed = list
					cb && cb(list)
				})
				return
			}
			let url = 'http://'+config.icecast.host+':'+config.icecast.port+'/admin/listclients?mount=/'+encodeURIComponent(m)
			let opt = { auth: config.icecast.admin.user+':'+config.icecast.admin.password }
			fetchXML(url, opt, function (err, data) {
				if (!err && data.icestats) {
					let listeners = data.icestats.source[0].listener
					if (!listeners) {
						listeners = []
					} else if (!Array.isArray(listeners)) {
						listeners = [listeners]
					}
					listeners.forEach((v) => {
						list.push({
							ip: v.IP[0],
							userAgent: v.UserAgent[0],
							time: Math.round(Date.now()/1000 - v.Connected[0]),
							id: v.ID[0],
							mount: m,
							location: undefined
						})
					})
				}
				mi++
				recursive()
			})
		}
		recursive()
	}

	setInterval(updateListenerInfo, 10*1000)

	Object.keys(servers).forEach((k) => handleServer(servers[k]))

	function fixAudioInfo(m) {
		let o = {}
		if (m && m.audio_info) {
			info = m.audio_info.split(';')
			info.forEach((v, i) => {
				pair = v.split('=')
				o[pair[0]] = pair[1]
			})
			o.type = m.server_type
		}
		return o
	}

	const API = {

		getListenerCount() {
			let count = 0
			for (let k in iceData) {
				let stats = iceData[k]
				let c = 0
				for (let scope in stats) {
					let keys = stats[scope]
					if (scope.indexOf('/') === 0 && config.icecast.mounts.indexOf(scope.substr(1)) !== -1) {
						if (+keys.listeners > 0) {
							c += +keys.listeners
						}
						if (servers[k].relay && keys.title) {
							c -= 1
						}
					}
				}
				count += Math.max(c, 0)
			}
			return count
		},

		getListenerPeak() {
			return listenerPeak
		},

		isOnline() {
			return !!iceData[config.icecast.host+':'+config.icecast.port]['/'+config.icecast.mounts[0]]
		},

		getInfo() {
			return {
				listeners: this.getListenerCount(),
				listener_peak: this.getListenerPeak(),
				online: this.isOnline()
			}
		},

		getListeners() {
			let list = []
			listenerDetailed.forEach((listener) => {
				let loc = listener.location || ipcache[listener.ip]
				if (loc && loc.statusCode == 'OK') {
					list.push({
						ip: listener.ip,
						location: {
							lng: loc.longitude,
							lat: loc.latitude,
							countryCode: loc.countryCode,
							countryName: loc.countryName,
							regionName: loc.regionName,
							cityName: loc.cityName,
							timezone: loc.timeZone
						},

						mount: listener.mount,
						connected: listener.time,
						userAgent: listener.userAgent
					})
				}
			})
			return list
		},

		getStreams() {
			let streams = []
			config.icecast.mounts.forEach((mount) => {
				let m = iceData[config.icecast.host+':'+config.icecast.port]['/'+mount]
				if (m) {
					streams.push({
						name: mount,
						url: m.listenurl,
						listeners: +m.listeners,
						listener_peak: +m.listener_peak,
						audio_info: fixAudioInfo(m)
					})
				}
			})
			return streams
		}
	}

	return API
}
