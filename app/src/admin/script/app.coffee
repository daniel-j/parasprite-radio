@App = do (Backbone, Marionette) ->
	'use strict'

	#Backbone.emulateHTTP = true
	#Backbone.fetchCache.localStorage = false

	Marionette.Behaviors.behaviorsLookup = ->
		window.Behavior

	App = new Marionette.Application

	App.addRegions
		sideRegion: '#side-region'
		contentRegion: '#content-region'
		navRegion: '#nav-region'

	App.reqres.setHandler "default:region", ->
		App.mainRegion

	App.on 'start', (options) ->
		App.module('Playlists').start()
		App.module('Playlist').start()
		App.module('Search').start()
		App.module('Browse').start()

		App.module('Nav').start
			region: @navRegion
			contentRegion: @contentRegion

		Backbone.history.start
			pushState: true
			root: '/admin/'


	App.commands.setHandler "register:instance", (instance, id) ->
		App.register instance, id

	App.commands.setHandler "unregister:instance", (instance, id) ->
		App.unregister instance, id


	App.commands.setHandler 'play:track', (file) ->
		imgTag = $('#imgTag')[0]
		imgTag.src = '/api/set/'+file
		audioTag = $('#audioTag')[0]
		audioTag.src = '/stream/'+file
		audioTag.play()


	App
