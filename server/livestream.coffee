
fetchXML = require('../scripts/fetcher').fetchXML
sse = require './sse'

interval = 5000


module.exports = (config) ->

	stats = null
	viewers = 0
	online = false

	sse.broadcast 'livestreamstatus', {online: false, viewers: 0}, true

	updateStats = ->
		fetchXML config.livestream.url_stats, null, (err, data) ->
			viewers = 0
			isOnline = false
			try
				stream = data.rtmp.server[0].application[0].live[0].stream[0]
				stats = stream
				count = 0
				stream.client.forEach (client) ->
					if client.flashver[0] != 'ngx-local-relay' and !client.publishing
						count++
				#console.log JSON.stringify stream
				isOnline = !!(stream.publishing && stream.active)
				if isOnline
					viewers = count

			catch e
				stats = null

			online = isOnline

			sse.broadcast 'livestreamstatus', {online: isOnline, viewers: viewers}, true

			#console.log isOnline, viewers

	updateStats()
	setInterval updateStats, interval


	API =

		getViewCount: ->
			viewers


		isOnline: ->
			return online

		getInfo: ->
			viewers: @getViewCount()
			online: @isOnline()

	API
