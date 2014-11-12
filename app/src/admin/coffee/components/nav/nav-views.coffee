@App.module 'Nav', (Nav, App, Backbone, Marionette, $, _) ->

	class Nav.MenuItem extends Marionette.ItemView
		tagName: 'li'
		template: 'nav-item'

		triggers:
			'click': 'clicked'

		modelEvents:
			'change:current': 'currentChanged'

		currentChanged: ->
			isCurrent = !!@model.get 'current'
			if isCurrent
				@$el.addClass 'current'
			else
				@$el.removeClass 'current'



	class Nav.Menu extends Marionette.CollectionView
		tagName: 'ul'
		childView: Nav.MenuItem
