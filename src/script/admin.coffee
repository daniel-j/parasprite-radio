
app = require('./app')

#Backbone.emulateHTTP = true
#Backbone.fetchCache.localStorage = false

Marionette.Behaviors.behaviorsLookup = ->
	window.Behavior

require('./behaviors/trackdrag')
require('./behaviors/trackmenu')
require('./behaviors/trackselect')

app.module 'playlists', require('./components/playlists')
app.module 'playlist', require('./components/playlist')
app.module 'search', require('./components/search')
app.module 'browse', require('./components/browse')
app.module 'queue', require('./components/queue')
app.module 'nav', require('./components/nav')

app.addRegions
	sideRegion: '#side-region'
	contentRegion: '#content-region'
	navRegion: '#nav-region'

app.reqres.setHandler "default:region", ->
	app.mainRegion

app.commands.setHandler "register:instance", (instance, id) ->
	app.register instance, id
app.commands.setHandler "unregister:instance", (instance, id) ->
	app.unregister instance, id

app.commands.setHandler 'play:track', (file) ->
	#return
	#imgTag = $('#imgTag')[0]
	#imgTag.src = '/api/set/'+file
	audioTag = $('#audioTag')[0]
	audioTag.src = '/api/audio/'+file
	audioTag.play()

app.commands.setHandler "queue:track", (track) ->
	path = if track.get('file') then '/audio/'+track.get('file') else track.get('url')
	$.ajax
		url: config.apiPath+"/queue?add="+encodeURIComponent(path)

app.on 'start', (options) ->
	app.module('search').start()
	app.module('browse').start()
	app.module('queue').start()
	app.module('playlists').start()
	app.module('playlist').start()

	app.module('nav').start
		region: @navRegion
		contentRegion: @contentRegion

	Backbone.history.start
		pushState: true
		root: '/admin/'



$(document).ready () ->
	return
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



app.start()


