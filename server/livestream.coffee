
fetchXML = require('../scripts/fetcher').fetchXML

interval = 5000


module.exports = (config) ->

	stats = null
	viewers = -1

	updateStats = ->
		fetchXML config.livestream.url_stats, (err, data) ->
			viewers = -1
			isOnline = false
			try
				stream = data.rtmp.server[0].application[0].live[0].stream[0]
				stats = stream
				#console.log JSON.stringify stream
				isOnline = !!(stream.publishing && stream.active)
				if isOnline
					viewers = (+stream.nclients[0])-1

			catch e
				stats = null

			#console.log isOnline, viewers

	updateStats()
	setInterval updateStats, interval


	API =

		getViewCount: ->
			if viewers != -1
				viewers
			else
				0
			

		isOnline: ->
			return viewers != -1

		getInfo: ->
			viewers: @getViewCount()
			online: @isOnline()

	API
