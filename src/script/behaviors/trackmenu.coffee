class Behavior.TrackMenu extends Marionette.Behavior

	events:
		'contextmenu': 'onMenu'

	onMenu: (e) ->
		e.preventDefault()
		#console.log @view.model.collection.where selected: true
		#console.log @view.model.get 'file'
		if @view.model.get('file') or @view.model.get('url')
			path = @view.model.get('file') or @view.model.get('url')
			if confirm "Do you want to queue this track?\n"+@view.model.get('title')+" - "+@view.model.get('artist')+"\n"+path
				App.commands.execute 'queue:track', @view.model

