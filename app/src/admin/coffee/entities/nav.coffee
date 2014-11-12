@App.module 'Entity.Nav', (Nav, App, Backbone, Marionette, $, _) ->

		class Nav.MenuItem extends Backbone.Model
			defaults:
				title: ''
				path: ''

		class Nav.Menu extends Backbone.Collection
			model: Nav.MenuItem

		menuitems =
			###index: new Nav.MenuItem
				title: "Status"
				name: 'status'
				path: ""
				query: '#statusLayout'
				default: true###

			search: new Nav.MenuItem
				title: "Search"
				name: 'search'
				path: "search"
				query: '#searchLayout'
				module: 'Search'
				default: true

			browse: new Nav.MenuItem
				title: "Browse"
				name: 'browse'
				path: "browse"
				query: '#browseLayout'
				module: 'Browse'

		menu =
			new Nav.Menu [
					menuitems.index
					menuitems.search
					menuitems.browse
			]

		App.reqres.setHandler "nav:menu:items", ->
			menu
