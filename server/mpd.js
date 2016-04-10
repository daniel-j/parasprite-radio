import mpd from 'mpd'
import genremap from 'id3-genre'

let timeout = 5000

function parseArrayMessage(msg, dividers = ['file', 'directory']) {
	// Function taken from
	// https://github.com/andrewrk/mpd.js/commit/729616d2d9df496081e5a37d35514357f88cd558

	let results = []
	let obj = null

	msg.split('\n').forEach((p) => {
		if (p.length === 0)
			return

		let keyValue = p.match(/([^ ]+): (.*)/)
		if (keyValue === null) {
			throw new Error('Could not parse entry "' + p + '"')
		}

		keyValue[1] = keyValue[1].toLowerCase()
		let n = +keyValue[2]
		if (!isNaN(n) && keyValue[2].length === n.toString().length) {
			keyValue[2] = n
		}

		if (dividers.indexOf(keyValue[1]) !== -1) {
			if (obj !== null) {
				results.push(obj)
			}
			obj = {}
		}

		if (!obj) {
			obj = {}
		}

		obj[keyValue[1]] = keyValue[2]
	})

	if (obj) {
		results.push(obj)
	}
	return results
}

function parseKeyValueMessage(msg) {
	let result = {}

	msg.split('\n').forEach((p) => {
		if (p.length === 0) {
			return
		}

		let keyValue = p.match(/([^ ]+): (.*)/)
		if (keyValue === null) {
			throw new Error('Could not parse entry "' + p + '"')
		}

		keyValue[1] = keyValue[1].toLowerCase()
		let n = +keyValue[2]
		if (!isNaN(n) && keyValue[2].length === n.toString().length) {
			keyValue[2] = n
		}

		result[keyValue[1]] = keyValue[2]
	})

	return result
}


function perfectSort(a, b) {
	a = a+''
	b = b+''
	return a.toLowerCase().localeCompare(b.toLowerCase())
}

function perfectSortKey(key) {
	return function (a, b) {
		a[key] = a[key]+''
		b[key] = b[key]+''
		return a[key].toLowerCase().localeCompare(b[key].toLowerCase())
	}
}

function fixGenre(track) {
	if (!track || !track.genre) {
		return
	}
	let m = (track.genre+'').match(/^\((\d*)\)$/)
	if (m) {
		track.genrefix = genremap(+m[1])
	} else {
		track.genrefix = track.genre
	}
	return track
}

export default function (config) {

	let mpdReady = false
	let client = null
	let mainPlaylist = []

	function mpdOnReady() {
		console.log('MPD: Ready!')
		mpdReady = true

		if (typeof config.mpd.password === 'string' && config.mpd.password !== '') {
			client.sendCommand(mpd.cmd('password', [config.mpd.password]), function (err, data) {
				if (err) {
					console.warn('MPD: Password INCORRECT')
					return
				}
				console.log('MPD: Password OK')
				mpdInit()
			})
		}
		else
			mpdInit()
	}

	function mpdInit() {
		updateMainPlaylist()
	}

	function mpdOnUpdate() {
		client.sendCommand(mpd.cmd('status', []), function (err, data) {
			if (err) {
				console.error(err)
			} else {
				data = parseKeyValueMessage(data)
				let id = data.updating_db || null
				if (id !== null) {
					console.log('MPD: Updating DB (#'+id+')')
				} else {
					console.log('MPD: Update complete')
					let i = 0
					while (i < dbUpdateCallbacks.length) {
						dbUpdateCallbacks[i](null)
						i++
					}
					dbUpdateCallbacks.length = 0
				}
			}
		})
	}

	function mpdOnStoredPlaylist() {
		updateMainPlaylist()
	}

	function mpdOnError(err) {
		console.error('MPD: Socket error: '+err)
	}

	function mpdOnEnd() {
		console.log('MPD: Socket ended')
		client = null
		mpdReady = false
	}

	function mpdConnect() {

		client = mpd.connect({
			host: config.mpd.host || 'localhost',
			port: config.mpd.port || 6600
		})
		console.log('MPD: Connecting..')
		client.on('ready', mpdOnReady)
		client.on('system-update', mpdOnUpdate)
		client.on('system-stored_playlist', mpdOnStoredPlaylist)
		client.on('error', mpdOnError)
		client.on('end', mpdOnEnd)
	}


	function mpdCheck(cb) {
		if (mpdReady) {
			cb(null)
		} else {
			if (client === null) {
				mpdConnect()
			}
			let sentCb = false
			let errorMsg = null

			client.once('ready', function () {
				if (!sentCb) {
					sentCb = true
					cb(null)
				}
			})
			client.once('error', function (err) {
				errorMsg = err
			})
			client.once('end', function () {
				if (!sentCb) {
					sentCb = true
					cb(''+(errorMsg || 'end'))
				}
			})

			setTimeout(() => {
				if (!(sentCb || false)) {
					sentCb = true
					if (client) {
						client.socket.end()
					}
					cb('timeout')
				}
			}, timeout)
		}
	}

	function mpdCommand(name, args = [], cb) {
		if (typeof args === 'string') {
			args = [args]
		}
		mpdCheck(function (err) {
			if (err) {
				console.warn('MPD: Check error: ' + err)
				cb(err, null)
			} else {
				client.sendCommand(mpd.cmd(name, args), function (err, data) {
					if (err) {
						console.warn('MPD ' + name+' ' + args.join(' ') + ': ' + err)
						cb(err, null)
					} else {
						cb(null, data)
					}
				})
			}
		})
	}

	let dbUpdateCallbacks = []

	mpdConnect()

	function updateMainPlaylist() {
		mpdCommand('listplaylist', [config.mpd.mainPlaylist], function (err, data) {
			if (err) {
				console.error(err)
			} else {
				let list = parseArrayMessage(data)
				mainPlaylist.length = 0
				for (let i = 0; i < list.length; i++) {
					mainPlaylist.push(list[i].file)
				}

				console.log('MPD: Updated main playlist with '+mainPlaylist.length+' tracks')
			}
		})
	}
	setInterval(() => {
		if (mpdReady) {
			updateMainPlaylist()
		}
	}, 10*60*1000)

	function trackInList(track) {
		if (!track) {
			return null
		}
		if (mainPlaylist.indexOf(track.file) !== -1) {
			track.inPlaylist = true
		}
		return track
	}


	const API = {

		disconnect(cb) {
			if (mpdReady && client) {
				mpdCommand('close', [], cb)
			}
		},


		search(type, text, cb) {
			// perform empty search check
			if (text === '') {
				cb(null, [])
				return
			}

			mpdCommand('search', [type, text], function (err, data) {
				if (err) {
					cb(null, [])
				} else {
					let tracks = parseArrayMessage(data)
					let i = 0
					while (i < Math.min(tracks.length, 100))
						if (tracks[i].hasOwnProperty('file')) {
							fixGenre(tracks[i])
							trackInList(tracks[i])
							i++
						} else {
							tracks.splice(i, 1)
						}
					cb(null, tracks)
				}
			})
		},

		update(cb) {
			mpdCommand('update', [], function (err, data) {
				if (err) {
					cb(err)
				} else {
					dbUpdateCallbacks.push(cb)
				}
			})
		},

		getAlbums(cb) {
			mpdCommand('list', ['album'], function (err, data) {
				if (err) {
					cb(null, [])
				} else {
					let albums = parseArrayMessage(data, 'album')
					let i = 0
					while (i < albums.length) {
						albums[i] = albums[i].album
						i++
					}
					albums.sort(perfectSort)

					cb(null, albums)
				}
			})
		},

		getArtists(cb) {
			mpdCommand('list', ['artist'], function (err, data) {
				if (err) {
					cb(null, [])
				} else {
					let artists = parseArrayMessage(data, 'artist')
					let i = 0
					while (i < artists.length) {
						artists[i] = artists[i].artist
						i++
					}
					artists.sort(perfectSort)
					cb(null, artists)
				}
			})
		},

		getAlbumArtists(cb) {
			mpdCommand('list', ['albumartist'], function (err, data) {
				if (err) {
					cb(null, [])
				} else {
					let artists = parseArrayMessage(data)
					let i = 0
					while (i < artists.length) {
						artists[i] = artists[i].AlbumArtist
						i++
					}
					artists.sort(perfectSort)
					cb(null, artists)
				}
			})
		},

		getTrackInfo(file, cb) {
			mpdCommand('find', ['file', file], function (err, data) {
				if (err) {
					cb(err, null)
				} else {
					cb(null, trackInList(fixGenre(parseKeyValueMessage(data))))
				}
			})
		},

		lsinfo(uri = '', cb) {
			mpdCommand('lsinfo', [uri], function (err, data) {
				if (err) {
					cb(null, [])
				} else {
					let list = parseArrayMessage(data)
					list.forEach((track) => {
						fixGenre(track)
						trackInList(track)
					})
					cb(null, list)
				}
			})
		},

		getPlaylists(cb) {
			mpdCommand('listplaylists', [], function (err, data) {
				if (err) {
					cb(err, null)
				} else {
					cb(null, parseArrayMessage(data, 'playlist'))
				}
			})
		},

		getPlaylist(name, cb) {
			mpdCommand('listplaylistinfo', [name], function (err, data) {
				if (err) {
					cb(err, null)
				} else {
					console.log(data)
					cb(null, parseArrayMessage(data))
				}
			})
		}
	}

	return API
}
