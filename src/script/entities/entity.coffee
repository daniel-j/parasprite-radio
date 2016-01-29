Entity = window.Entity || {}
require './nav'

class Entity.SortableCollection extends Backbone.Collection

	sortFields: []
	sortOrder: 'ascending'

	comparator: (m1, m2) ->
		i = 0
		n = 0
		while i < @sortFields.length and n == 0
			field = (@sortFields[i] or '')+''

			swapOrder = field.indexOf('!') == 0
			if swapOrder
				field = field.substr 1

			a = m1.get(field)
			b = m2.get(field)
			if a == null or a == undefined then a = ''
			if b == null or b == undefined then b = ''

			if typeof a == 'string' and typeof b == 'string'
				if a == '' and b == ''
					n = 0
				else if a != '' and b == ''
					n = -1
				else if a == '' and b != ''
					n = 1
				else
					n = a.toLowerCase().localeCompare(b.toLowerCase())
			else
				if b < a then n = 1
				else if b > a then n = -1

			if swapOrder
				n *= -1

			i++

		if @sortOrder == 'descending' or @sortOrder == 'desc'
			n *= -1
		n

class Entity.Track extends Backbone.Model
	idAttribute: 'file'
	url: ->
		config.apiPath+"/track?f="+encodeURIComponent(@get('file'))
	defaults:
		track: null
		file: ''
		title: ''
		artist: ''
		album: null
		albumartist: null
		time: null
		'last-modified': null
		date: null
		genre: ''
		inPlaylist: false
		source: null

		selected: false


class Entity.Directory extends Backbone.Model
	idAttribute: 'directory'

class Entity.Tracks extends Entity.SortableCollection
	sortFields: ['directory', 'album', 'albumartist', 'disc', 'track', 'artist', 'title', 'file']
	model: (attrs, options) ->
		if attrs.directory
			new Entity.Directory attrs, options
		else
			new Entity.Track attrs, options

class Entity.Album extends Backbone.Model
	idAttribute: 'album'
	defaults:
		album: ''

class Entity.Albums extends Backbone.Collection
	url: config.apiPath+'/albums'

class Entity.Search extends Entity.Tracks
	url: ->
		config.apiPath+"/search?q="+encodeURIComponent(@query)+"&t="+encodeURIComponent(@type)


class Entity.Browse extends Entity.Tracks
	url: ->
		while @path.indexOf('/') == 0
			@path = @path.substr 1
		config.apiPath+"/files/"+encodeURI(@path).replace(/#/, "%23")

class Entity.BrowsePathItem extends Backbone.Model

class Entity.BrowsePath extends Backbone.Collection
	model: Entity.BrowsePathItem


class Entity.Playlist extends Backbone.Collection
	idAttribute: 'playlist'
	url: ->
		config.apiPath+"/playlist/"+encodeURI(@playlist).replace(/#/, "%23")

class Entity.Playlists extends Backbone.Collection
	url: config.apiPath+'/playlists'

class Entity.QueueList extends Backbone.Collection
	idAttribute: 'rid'
	url: ->
		config.apiPath+"/queue/list"

module.exports = Entity
