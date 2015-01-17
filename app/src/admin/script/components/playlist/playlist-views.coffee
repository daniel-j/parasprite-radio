@App.module 'Playlist', (Playlist, App, Backbone, Marionette, $, _) ->
	
	class Playlist.Layout extends Marionette.LayoutView
		el: '#playlistLayout'
		template: false

		regions:
			listRegion: '#playlistList'
	