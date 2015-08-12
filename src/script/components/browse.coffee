Entity = require('../entities/entity')
View = require('../admin/views')

class Browse extends Marionette.Module
	startWithParent: false

	onStart: ->
		@controller = new Browse.Controller
	
class Browse.Router extends Marionette.AppRouter
	appRoutes:
		'browse/*path': 'showPath'

class Browse.Controller extends Base.Controller
	initialize: (options) ->

		new Browse.Router
			controller: @

		@currentPath = null

		@layout = @getLayout()

		@tracks = new Entity.Browse
		@path = new Entity.BrowsePath


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
		new View.Tracks
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




class Browse.Layout extends Marionette.LayoutView
	el: '#browseLayout'
	template: false

	regions:
		fileList: '#fileList'
		browsePath: '#browsePath'


class Browse.PathItem extends Marionette.ItemView
	tagName: 'li'
	template: require('template/browse.pathitem.mustache')

	events:
		'click div': 'clicked'

	clicked: ->
		@trigger 'click', @model


	modelEvents:
		'change': 'modelChanged'

	initialize: ->
		@modelChanged()

	modelChanged: ->
		if @model.get 'current'
			@$el.addClass 'current'
		else
			@$el.removeClass 'current'
		@render()




class Browse.Path extends Marionette.CollectionView
	tagName: 'ul'
	template: false
	childView: Browse.PathItem
	className: 'browse-path'


	initialize: (e) ->
		@currentPath = null
		@listenTo @, 'childview:click', (childView, m) =>
			col = @collection
			pos = col.indexOf m
			path = col.pluck('name').slice(0, pos+1).join('/')
			@trigger 'path:change', path, true
			@trigger 'path:navigate', path
			for m, i in @collection.models
				m.set 'current', i == pos
				
			@currentPath = path

	setPath: (path, fromUser, instant) ->
		if @currentPath != path
			parts = path.split '/'
			oldparts = (@currentPath || '').split '/'

			col = @collection

			for name, i in parts
				m = @collection.models[i]
				if !m
					m = new Backbone.Model
						name: name
					@collection.add m, at: i
				else if m.get('name') != name
					m.set 'name', name
			
			for m, i in @collection.models
				m.set 'current', i == parts.length-1

			while @collection.length > parts.length and @collection.length > oldparts.length
				@collection.pop()

		@trigger 'path:change', path, fromUser, instant
		@currentPath = path

module.exports = Browse
