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
		App.module('Queue').start()

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


	$(document).ready () ->
		$('#fullCalendar').fullCalendar
			googleCalendarApiKey: 'AIzaSyCy9wZk9I3SmTV7PZB9oF7L9MbOHqThAcA'
			events:
				googleCalendarId: 'nj4dn0ck0u66t6f38qtqnj324k@group.calendar.google.com'

			header:
				left: 'prev,next today'
				center: 'title'
				right: 'month,agendaWeek,agendaDay'
			defaultView: 'agendaWeek'
			editable: false
			weekNumbers: true


	App
