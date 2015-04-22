@App.module 'Browse', (Browse, App, Backbone, Marionette, $, _) ->
	@startWithParent = false

	@addInitializer ->
		Browse.controller = new Browse.Controller
		
	class Browse.Router extends Marionette.AppRouter
		appRoutes:
			'browse/*path': 'showPath'

	class Browse.Controller extends Base.Controller
		initialize: (options) ->

			new Browse.Router
				controller: @

			@currentPath = null

			@layout = @getLayout()

			@tracks = new App.Entity.Browse
			@path = new App.Entity.BrowsePath


			@listView = @getListView @tracks
			@pathView = @getPathView @path

			@listenTo @pathView, 'path:change', (path, fromUser, instant) =>
				if instant then App.commands.execute 'navigate', 'browse'
				#console.log 'path:change', path, fromUser, instant
				@currentPath = path
				@tracks.path = path
				@tracks.fetch
					reset: true
					success: ->
						if fromUser and !instant
							App.commands.execute 'navigate', 'browse'

			@listenTo @pathView, 'path:navigate', (path) ->
				if path == '' then path = '/'
				#console.log 'path:navigate', path
				App.navigate 'browse'+encodeURI(path)

			@listenTo @, 'navigate', =>
				path = @currentPath
				@browsePath path
				if path == '' then path = '/'
				App.navigate 'browse'+encodeURI(path)

			App.commands.setHandler 'browse:directory', (path, fromUser, instant) =>
				if path != '' then path = '/'+path
				#console.log 'browse:directory', path
				@browsePath path, fromUser, instant
				if fromUser
					if path == '' then path = '/'
					App.navigate 'browse'+encodeURI(path)

			@layout.fileList.show @listView
			@layout.browsePath.show @pathView

			@pathView.setPath ''


		getLayout: ->
			new Browse.Layout

		getPathView: (collection) ->
			new Browse.Path
				collection: collection

		getListView: (collection) ->
			new App.View.Tracks
				collection: collection

		browsePath: (path, fromUser, instant) ->
			#console.log 'browsePath IN', path
			if path != '' and path.indexOf('/') != 0
				path = '/'+path
			#console.log 'browsePath OUT', path
			@pathView.setPath path, fromUser, instant

		showPath: (path) ->
			path = path || ''
			@browsePath path || '', true