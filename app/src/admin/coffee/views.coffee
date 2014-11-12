@App.module 'View', (View, App, Backbone, Marionette, $, _) ->

	class View.TrackDrag extends Marionette.ItemView
		attributes:
			draggable: true # can't put in behavior

		behaviors:
			TrackDrag: {}
			TrackSelect: {}

	class View.Track extends View.TrackDrag
		tagName: 'tr'
		template: 'track-item'

		events:
			'click a': 'anchorClicked'
			'dblclick': 'doubleClicked'

		templateHelpers: ->
			if !@model.get('directory')
				timefix = App.request "format:time", @model.get('time')
				titlefix = @model.get('title')
				path = @model.get('file').split '/'
				name = path.pop()
				dir = path.join '/'
			else
				timefix = ''
				titlefix = @model.get('directory').split('/').pop()
				name = ''
				dir = ''

			time: timefix
			title: titlefix
			name: name
			dir: dir
			'last-modified': moment(@model.get('last-modified')).format('MMM D YYYY hh:mm:ss')

		doubleClicked: (e) ->
			e.preventDefault()
			if e.ctrlKey or e.shiftKey then return
			if @model.has 'directory'
				App.commands.execute 'browse:directory', @model.get('directory'), true
			else
				App.commands.execute 'play:track', @model.get('file')

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



	class View.Tracks extends Marionette.CompositeView
		tagName: 'table'
		className: 'track-list'
		template: 'track-list'
		childView: View.Track
		childViewContainer: 'tbody'

		behaviors:
			TracklistSelect: {}
