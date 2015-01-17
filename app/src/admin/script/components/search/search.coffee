@App.module 'Search', (Search, App, Backbone, Marionette, $, _) ->
	@startWithParent = false

	@addInitializer ->
		Search.controller = new Search.Controller


	class Search.Router extends Marionette.AppRouter
		appRoutes:
			'search/:type/*query': 'showSearchResult'
			#'search/': 'showSearchResult'


	class Search.Controller extends App.Base.Controller
		initialize: (options) ->

			new Search.Router
				controller: @

			@currentType = 'any'
			@currentQuery = ''

			@layout = @getLayout()

			@tracks = new App.Entity.Search
			@list = @getTracksView @tracks
			@layout.searchResult.show @list

			App.commands.setHandler 'search', (query = '', type = 'any', fromUser, instant) =>
				if fromUser
					App.navigate 'search/'+encodeURIComponent(type)+'/'+encodeURIComponent(query)
				@search query, type, fromUser, instant

			@listenTo @, 'navigate', =>
				@search @currentQuery, @currentType
				App.navigate 'search/'+encodeURIComponent(@currentType)+'/'+encodeURIComponent(@currentQuery)


		getLayout: ->
			new Search.Layout

		getTracksView: (tracks) ->
			new App.View.Tracks
				collection: tracks

		search: (query = '', type = 'any', fromUser, instant) ->
			if instant then App.commands.execute 'navigate', 'search'
			unless query then query = ''
			@currentQuery = query
			@currentType = type
			@layout.updateForm query, type
			if @query == ''
				@tracks.reset()
				if fromUser and !instant
					App.commands.execute 'navigate', 'search'
			else
				@tracks.query = query
				@tracks.type = type
				@tracks.fetch
					reset: true
					success: ->
						if fromUser and !instant
							App.commands.execute 'navigate', 'search'


		showSearchResult: (type = 'any', query = '') ->
			@search query, type, true, false