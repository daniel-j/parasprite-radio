@App.module 'Search', (Search, App, Backbone, Marionette, $, _) ->

	Search.Layout = Marionette.LayoutView.extend
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
