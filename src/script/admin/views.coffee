formattime = require('utils/time').formattime
basename = require('utils/basename').default
moment = require 'moment'

class View

class View.Track extends Marionette.ItemView
	tagName: 'tr'
	template: require('template/track.item.mustache')

	attributes:
		draggable: true # can't put in behavior

	behaviors:
		TrackDrag: {}
		TrackSelect: {}
		TrackMenu: {}

	events:
		'click a': 'anchorClicked'
		'click': 'doubleClicked'

	templateHelpers: ->
		extraclasses = []
		if !@model.get('directory')
			timefix = if typeof @model.get('time') == 'number' then formattime @model.get('time') else ''
			titlefix = @model.get('title') or basename @model.get('file')
			path = @model.get('file').split '/'
			name = path.pop()
			dir = path.join '/'
			if !@model.get('title')
				extraclasses.push 'shade'
		else
			timefix = ''
			titlefix = @model.get('directory').split('/').pop()
			name = ''
			dir = ''

		lm = @model.get('last-modified')

		time: timefix
		title: titlefix
		name: name or @model.get('url') or ''
		dir: dir
		'last-modified': if lm then moment(lm).format('MMM D YYYY hh:mm:ss') else ''
		extraclasses: extraclasses.join ' '

	doubleClicked: (e) ->
		e.preventDefault()
		if e.ctrlKey or e.shiftKey then return
		if @model.has 'directory'
			App.commands.execute 'browse:directory', @model.get('directory'), true
		#else
		#	App.commands.execute 'play:track', @model.get('file')

	anchorClicked: (e) ->
		e.preventDefault()
		type = e.target.className

		if type == 'browse'
			if @model.has 'directory'
				path = @model.get 'directory'
			else
				path = @model.get('file').split '/'
				path.pop()
				path = path.join '/'
			App.commands.execute 'browse:directory', path, true

		else if type == 'play'
			App.commands.execute 'play:track', @model.get 'file'

		else if type == 'artist'
			App.commands.execute 'search', @model.get('artist'), 'artist', true
		else if type == 'album'
			App.commands.execute 'search', @model.get('album'), 'album', true
		else if type == 'albumartist'
				App.commands.execute 'search', @model.get('albumartist'), 'albumartist', true
		else if type == 'genre'
			App.commands.execute 'search', @model.get('genre'), 'genre', true

	initialize: () ->
		if @model.get('inPlaylist')
			@el.classList.add 'inplaylist'
		if @model.get('source')
			@el.classList.add 'source-'+@model.get('source')

class View.Tracks extends Marionette.CompositeView
	tagName: 'table'
	className: 'track-list'
	template: require('template/track.list.mustache')
	childView: View.Track
	childViewContainer: 'tbody'

	behaviors:
		TracklistSelect: {}

module.exports = View
