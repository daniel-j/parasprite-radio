'use strict'
var url = require('url')

var sse = {}
var recievers = []
var pastEvents = {}

function handle(req, res) {
	var parsedURL = url.parse(req.url, true)
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Access-Control-Allow-Origin': '*',
		'X-Accel-Buffering': 'no'
	})
	res.write(':' + Array(2049).join(' ') + '\n', 'utf8') // 2kB padding for IE
	res.write('retry: 10000\n', 'utf8')

	var lastEventId = Number(req.headers['last-event-id']) || Number(parsedURL.query.lastEventId) || 0

	// keep-alive
	var kaTimer = setInterval(function () {
		console.log(': KA\n\n')
		res.write(': KA\n\n', 'utf8')
	}, 10*1000)
	recievers.push(res)

	// send initial data
	for (var ev in pastEvents) {
		console.log(pastEvents[ev])
		res.write(pastEvents[ev])
	}

	res.once('close', function () {
		clearInterval(kaTimer)
		recievers.splice(recievers.indexOf(res), 1)
	})
	res.once('error', function (err) {
		console.log('sse response error', err)
	})
}

function broadcast(event, data, remember) {
	var msg = formatMessage(event, data)
	if (event && remember && pastEvents[event] === msg) {
		// same message already sent
	} else {
		console.log(msg)
		recievers.forEach(function (res) {
			res.write(msg, 'utf8')
		})
		if (event && remember) {
			pastEvents[event] = msg
		}
	}
}

function formatMessage(event, data) {
	var msg = ''
	event = event.trim()
	msg += 'data: '+JSON.stringify({e: event, d: data})+'\n'
	msg += '\n'
	return msg
}

sse.handle = handle
sse.broadcast = broadcast

module.exports = sse
