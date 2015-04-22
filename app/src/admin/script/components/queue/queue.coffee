@App.module 'Queue', (Queue, App, Backbone, Marionette, $, _) ->
	@startWithParent = false

	@addInitializer ->
		Queue.controller = new Queue.Controller
		
	class Queue.Router extends Marionette.AppRouter
		appRoutes:
			'queue': 'showQueue'
			'queue/': 'showQueue'

	class Queue.Controller extends Base.Controller
		initialize: (options) ->

			new Queue.Router
				controller: @

			@layout = @getLayout()

			@tracks = new App.Entity.QueueList

			@listView = @getListView @tracks

			@listenTo @, 'navigate', =>
				@tracks.fetch
					reset: true
					success: ->
						App.commands.execute 'navigate', 'queue'
				App.navigate 'queue/'

			@layout.listRegion.show @listView

			console.log "yo"


		getLayout: ->
			new Queue.Layout

		getListView: (collection) ->
			new App.View.Tracks
				collection: collection

		showQueue: ->
			console.log 'show queue'
			@trigger 'navigate'