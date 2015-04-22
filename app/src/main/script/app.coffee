@App = do (Backbone, Marionette) ->
	'use strict'

	#Backbone.emulateHTTP = true
	#Backbone.fetchCache.localStorage = false

	Marionette.Behaviors.behaviorsLookup = ->
		window.Behavior

	App = new Marionette.Application

	App.addRegions
		mainRegion: '.page-wrapper'
		navRegion: '#navigation'

	App.reqres.setHandler "default:region", ->
		App.mainRegion

	App.on 'start', (options) ->
		App.module('Player').start()
		App.module('History').start()
		App.module('Playlist').start()

		App.module('Nav').start
			region: @navRegion
			contentRegion: @mainRegion

		Backbone.history.start
			pushState: true
			root: '/'


	App.commands.setHandler "register:instance", (instance, id) ->
		App.register instance, id

	App.commands.setHandler "unregister:instance", (instance, id) ->
		App.unregister instance, id

	App
