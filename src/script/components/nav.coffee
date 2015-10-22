class Nav extends Marionette.Module
	startWithParent: false

	onStart: (options) ->
		@controller = new Nav.Controller options

class Nav.Controller extends Base.Controller
	initialize: (options) ->
		@contentRegion = options.contentRegion

		@menuitems = App.request 'nav:menu:items'
		@menu = @getNavView @menuitems

		@currentItem = @menuitems.findWhere
			default: true

		@show @menu

		@showContent @currentItem

		@listenTo @menu, 'childview:clicked', (item) =>
			@showContent item.model, true

		App.commands.setHandler 'navigate', (name = '') =>
			model = @menuitems.findWhere name: name
			if model
				@showContent model


	showContent: (model, fromClick) ->

		q = @currentItem.get 'query'
		el = @contentRegion.$el.find q
		el.css display: 'none'
		@currentItem.set 'current', false

		@currentItem = model
		q = @currentItem.get 'query'
		el = @contentRegion.$el.find q
		el.css display: 'block'
		@currentItem.set 'current', true

		if fromClick and @currentItem.has 'module'
			module = @currentItem.get 'module'
			ctrl = App.module(module).controller
			if ctrl
				ctrl.trigger 'navigate'

	getNavView: (collection) ->
		new Nav.Menu
			collection: collection


class Nav.MenuItem extends Marionette.ItemView
	tagName: 'li'
	template: require('template/nav.item.mustache')

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

module.exports = Nav
