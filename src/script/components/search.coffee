Entity = require('entities/entity')
View = require('admin/views')

class Search extends Marionette.Module
	startWithParent: false

	onStart: ->
		@controller = new Search.Controller


	class Search.Router extends Marionette.AppRouter
		appRoutes:
			'search/:type/*query': 'showSearchResult'
			#'search/': 'showSearchResult'


	class Search.Controller extends Base.Controller
		initialize: (options) ->

			new Search.Router
				controller: @

			@currentType = 'any'
			@currentQuery = ''

			@layout = @getLayout()

			@tracks = new Entity.Search
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
			new View.Tracks
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



	class Search.Layout extends Marionette.LayoutView
		el: '#searchLayout'
		template: false

		ui:
			searchForm: '#searchForm'

		events:
			'submit @ui.searchForm': 'onFormSubmit'

		regions:
			searchResult: '#searchResult'

		onFormSubmit: (e) ->
			e.preventDefault()
			query = e.target.query.value
			type = e.target.type.value
			App.commands.execute 'search', query, type, true

		updateForm: (query, type) ->
			# using @ui.searchForm directly don't work :(
			searchForm = @$el.find @ui.searchForm
			searchForm[0].query.value = query
			searchForm[0].type.value = type

module.exports = Search
