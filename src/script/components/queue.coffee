Entity = require('../entities/entity')
View = require('../admin/views')

class Queue extends Marionette.Module
	startWithParent: false

	onStart: ->
		@controller = new Queue.Controller

class Queue.Router extends Marionette.AppRouter
	appRoutes:
		'queue': 'showQueue'
		'queue/': 'showQueue'

class Queue.Controller extends Base.Controller
	initialize: (options) ->

		new Queue.Router
			controller: @

		@layout = @getLayout()

		@tracks = new Entity.QueueList

		@listView = @getListView @tracks

		@listenTo @, 'navigate', =>
			@tracks.fetch
				reset: true
				success: ->
					App.commands.execute 'navigate', 'queue'
			App.navigate 'queue/'

		@layout.listRegion.show @listView


	getLayout: ->
		new Queue.Layout

	getListView: (collection) ->
		new View.Tracks
			collection: collection

	showQueue: ->
		console.log 'show queue'
		@trigger 'navigate'

class Queue.Layout extends Marionette.LayoutView
	el: '#queueLayout'
	template: false

	regions:
		listRegion: '#queueList'

module.exports = Queue
