@App.module 'Playlists', (Playlists, App, Backbone, Marionette, $, _) ->

	class Playlists.Layout extends Marionette.LayoutView
		el: '#playlistsLayout'
		template: false

		regions:
			listRegion: '#playlistsRegion'


	class Playlists.Item extends Marionette.ItemView
		tagName: 'li'
		template: 'playlists-item'

	class Playlists.List extends Marionette.CollectionView
		tagName: 'ul'
		template: false
		childView: Playlists.Item
		className: 'playlists-list'