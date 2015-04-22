
http = require 'http'

module.exports =
	# Grab JSON from an url 
	fetchJSON: (url, callback) ->
		http.get(url, (res) ->
			data = ''

			res.on 'data', (chunk) ->
				data += chunk;

			res.on 'end', ->
				try
					obj = JSON.parse data
					callback null, obj
				catch err
					callback err

		).on 'error', (e) ->
			callback e.message