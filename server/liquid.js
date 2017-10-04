
import net from 'net'
import path from 'path'
import generateArt from './utils/generateArt'
import sse from './sse'
import config from '../scripts/config'

let timeout = 5000

let metadata = {}
let imagedata = null
let badComment = /^([0-9A-F]{8} ){9}[0-9A-F]{8}$/

function liqCommand (command, cb) {
  command = command + '\r\n'
  let sentCb = false
  let errorMsg = null
  let liqData = ''

  function liqOnData (data) {
    let s = data.toString('utf8')
    liqData += s

    let a = s.split('\r\n')
    a.pop()
    if (a[a.length - 1] === 'END') {
      let d = liqData.split('\r\n')
      d.pop() // remove last newline
      d.pop() // remove END
      liqData = ''
      if (d.length === 1) {
        d = d[0].split('\n')
        if (d.length === 1) {
          d = d[0]
        }
      }
      if (Array.isArray(d)) {
        let out = {}
        let o = out
        for (let line of d) {
          let m = line.match(/^--- (\d*) ---$/)
          if (m) {
            o = out[+m[1]] = {}
          }
          let pos = line.indexOf('=')
          if (pos !== -1) {
            let key = line.substr(0, pos)
            let val = line.substr(pos + 1)
            try {
              o[key] = JSON.parse(val)
            } catch (err) {
              // do nothing
            }
          }
        }
        d = out
      }
      if (!sentCb) {
        sentCb = true
        client.end('quit\r\n')
        cb(null, d)
      }
    }
  }

  let client = net.connect({
    host: config.liquidsoap.host || 'localhost',
    port: config.liquidsoap.port_telnet || 1234
  })
  client.on('data', liqOnData)
  client.setTimeout(10 * 1000)

  client.once('connect', function () {
    client.write(command, 'utf8')
  })
  client.once('error', function (err) {
    console.error('Liquidsoap: ' + err)
    errorMsg = err
  })
  client.once('timeout', function () {
    client.end()
  })
  client.once('end', function () {
    if (!sentCb) {
      sentCb = true
      cb('' + (errorMsg || 'end'))
    }
  })

  setTimeout(() => {
    if (!sentCb) {
      sentCb = true
      client.end()
      cb('timeout')
    }
  }, timeout)
}

const API = {
  queue: {
    getList (cb) {
      let list = []
      let meta = []
      liqCommand('queue1.queue', (err1, data) => {
        list = list.concat((data || '').split(' '))
        liqCommand('queue2.queue', (err2, data) => {
          list = list.concat((data || '').split(' '))
          liqCommand('queue3.queue', (err3, data) => {
            list = list.concat((data || '').split(' '))
            function f (i) {
              liqCommand('request.metadata ' + list[i], function (err, data) {
                if (err) {

                } else {
                  if (typeof data === 'string') {
                    data = {
                      error: data,
                      file: ''
                    }
                  } else {
                    data.file = data.filename ? data.filename.replace(config.general.media_dir + '/', '') : data.initial_uri
                    delete data.filename
                  }
                  if (data.source && data.source.indexOf('queue') === 0 && data.status && data.status !== 'destroyed') {
                    meta.push(data)
                  }
                }
                ++i
                if (i < list.length) {
                  f(i)
                } else {
                  cb(null, meta)
                }
              })
            }
            f(0)
          })
        })
      })
    },

    add (id, item, cb) {
      console.log('Liquidsoap: Add to queue:', item)
      liqCommand('queue' + id + '.push ' + item, function (err, data) {
        cb && cb(err)
      })
    }

    // ignore: (rid, cb) ->
    //  liqCommand "request.ignore "+rid, (err, data) ->
    //    cb err
    // consider: (rid, cb) ->
    //  liqCommand "request.consider "+rid, (err, data) ->
    //    cb err

    // smart: (thing, cb) ->
    //  liqCommand "smartqueue "+thing, (err, data) ->
    //    cb && cb err
  },

  announce (message, cb) {
    liqCommand('announce.push smart:' + message, function (err, data) {
      cb(err)
    })
  },

  skip (cb) {
    liqCommand('skip', function (err, data) {
      cb && cb(err)
    })
  },

  setMeta (m) {
    metadata.title = m.title || (m.filename && path.basename(m.filename, path.extname(m.filename))) || null
    metadata.artist = m.artist || null
    metadata.album = m.album || null
    metadata.albumartist = m.albumartist || null
    metadata.url = m.url || null
    metadata.year = +m.year || null
    metadata.art = config.server.api_prefix + '/now/art/small' // m.art || null
    metadata.bitrate = +m.bitrate || m.bitrate || null
    metadata.bitrate_mode = m.bitrate_mode || null
    metadata.ext = (m.filename && path.extname(path.basename(m.filename)).substring(1)) || null
    metadata.on_air = new Date(m.on_air).getTime()
    metadata.duration = +m.duration
    metadata.source = m.source || 'default'
    metadata.comment = (m.comment !== '0' && !badComment.test(m.comment) && m.comment) || null
    metadata.live = {
      active: false,
      stream_name: m.live_ice_name || m.live_name || null,
      host: m.live_displayname || m.live_username || null,
      url: m.live_url || null,
      twitter_handle: m.live_twitter || null,
      description: m.live_ice_description || m.live_description || null
    }

    if (m.live_userId) {
      metadata.live.active = true
      metadata.source = 'live'
    }

    generateArt((m.art || m.filename), function (err, result) {
      if (err) {
        console.error('Generate art: ' + err, (m.art || m.filename))
        imagedata = null
      } else {
        imagedata = result
      }

      sse.broadcast('metadata', metadata, true)
    })
  },

  updateMeta (cb) {
    liqCommand('sendmetadata', function (err, data) {
      if (err) {
        console.error('Liquidsoap: Couldn\'t fetch metadata: ' + err)
      }
      cb && cb(err, data)
    })
  },

  getMeta () {
    return metadata
  },

  getImage () {
    return imagedata
  },

  getHistory (cb) {
    liqCommand('history.get', function (err, data) {
      if (err) {
        cb(err)
        return
      }
      let list = []
      for (let id in data) {
        let item = data[id]
        item.timestamp = new Date(item.on_air).getTime()
        list.push(item)
      }
      list.sort((a, b) => b.timestamp - a.timestamp)

      cb(null, list)
    })
  },

  eventStarted (ev) {
    let list = (ev.description || '').trim().split('\n')
    for (let r in list) {
      API.queue.add(1, 'smart:' + r)
    }
  },

  eventEnded (ev) {
    // noop
  }
}

API.updateMeta()

export default API
