Entity = require('../entities/entity')

class Playlists extends Marionette.Module
	startWithParent: false

	onStart: ->
		@controller = new Playlists.Controller
		

class Playlists.Controller extends Base.Controller
	initialize: (options) ->

		@layout = @getLayout()

		@playlists = new Entity.Playlists
		@playlists.fetch()

		@listView = @getListView @playlists

		App.commands.setHandler 'view:playlist', (playlist) =>
			App.navigate 'playlist/'+encodeURI(path)
			@ # fix lint warning

		@layout.listRegion.show @listView


	getLayout: ->
		new Playlists.Layout

	getListView: (collection) ->
		new Playlists.List
			collection: collection


class Playlists.Layout extends Marionette.LayoutView
	el: '#playlistsLayout'
	template: false

	regions:
		listRegion: '#playlistsRegion'


class Playlists.Item extends Marionette.ItemView
	tagName: 'li'
	template: require('template/playlist.item.mustache')

class Playlists.List extends Marionette.CollectionView
	tagName: 'ul'
	template: false
	childView: Playlists.Item
	className: 'playlists-list'

module.exports = Playlists
