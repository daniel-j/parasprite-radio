@App = do (Backbone, Marionette) ->
	'use strict'

	#Backbone.emulateHTTP = true
	#Backbone.fetchCache.localStorage = false

	Marionette.Behaviors.behaviorsLookup = ->
		window.Behavior

	App = new Marionette.Application

	App.addRegions
		contentRegion: '#content-region'
		navRegion: '#nav-region'

	App.reqres.setHandler "default:region", ->
		App.mainRegion

	App.on 'start', (options) ->

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

	App
