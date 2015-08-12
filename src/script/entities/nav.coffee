Entity = require('./entity')
Nav = Entity.Nav = {}

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
		module: 'search'
		default: true

	browse: new Nav.MenuItem
		title: "Browse"
		name: 'browse'
		path: "browse"
		query: '#browseLayout'
		module: 'browse'

	queue: new Nav.MenuItem
		title: "Queue"
		name: 'queue'
		path: "queue"
		query: '#queueLayout'
		module: 'queue'

	playlist: new Nav.MenuItem
		title: "Playlist"
		name: 'playlist'
		path: 'playlist'
		query: '#playlistLayout'
		module: 'playlist'

	schedule: new Nav.MenuItem
		title: "Schedule"
		name: 'schedule'
		path: 'schedule'
		query: '#scheduleLayout'
		module: 'schedule'

menu =
	new Nav.Menu [
			#menuitems.index
			menuitems.search
			menuitems.browse
			menuitems.queue
			#menuitems.playlist
			#menuitems.schedule
	]

App.reqres.setHandler "nav:menu:items", ->
	menu
