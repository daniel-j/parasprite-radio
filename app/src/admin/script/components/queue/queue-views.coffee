@App.module 'Queue', (Queue, App, Backbone, Marionette, $, _) ->
	
	class Queue.Layout extends Marionette.LayoutView
		el: '#queueLayout'
		template: false

		regions:
			listRegion: '#queueList'
	