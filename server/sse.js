'use strict'
// const url = require('url')

const sse = {}
const recievers = []
const pastEvents = {}

function handle (req, res) {
  // let parsedURL = url.parse(req.url, true)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no'
  })
  res.write(':' + Array(2049).join(' ') + '\n', 'utf8') // 2kB padding for IE
  res.write('retry: 10000\n', 'utf8')

  // let lastEventId = Number(req.headers['last-event-id']) || Number(parsedURL.query.lastEventId) || 0

  // keep-alive
  let kaTimer = setInterval(function () {
    res.write(formatMessage('ka', 1))
    res.flush()
  }, 10 * 1000)
  recievers.push(res)

  res.write(formatMessage('timestamp', Date.now()))

  // send initial data
  for (let ev in pastEvents) {
    res.write(pastEvents[ev])
  }
  res.flush()

  res.once('close', function () {
    clearInterval(kaTimer)
    recievers.splice(recievers.indexOf(res), 1)
  })
  res.once('error', function (err) {
    console.log('sse response error', err)
  })
}

function broadcast (event, data, remember) {
  let msg = formatMessage(event, data)
  if (event && remember && pastEvents[event] === msg) {
    // same message already sent
  } else {
    recievers.forEach(function (res) {
      res.write(msg, 'utf8')
      res.flush()
    })
    if (event && remember) {
      pastEvents[event] = msg
    }
  }
}

function formatMessage (event, data) {
  let msg = ''
  event = event.trim()
  msg += 'data: ' + JSON.stringify({e: event, d: data}) + '\n'
  msg += '\n'
  return msg
}

sse.handle = handle
sse.broadcast = broadcast

module.exports = sse
