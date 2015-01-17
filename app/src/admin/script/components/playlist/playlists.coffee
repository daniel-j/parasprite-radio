@App.module 'Playlists', (Playlists, App, Backbone, Marionette, $, _) ->
	@startWithParent = false

	@addInitializer ->
		Playlists.controller = new Playlists.Controller
		

	class Playlists.Controller extends App.Base.Controller
		initialize: (options) ->

			@layout = @getLayout()

			@playlists = new App.Entity.Playlists
			@playlists.fetch()

			@listView = @getListView @playlists

			App.commands.setHandler 'view:playlist', (playlist) =>
				App.navigate 'playlist/'+encodeURI(path)

			@layout.listRegion.show @listView


		getLayout: ->
			new Playlists.Layout

		getListView: (collection) ->
			new Playlists.List
				collection: collection