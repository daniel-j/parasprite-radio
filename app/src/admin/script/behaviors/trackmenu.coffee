class Behavior.TrackMenu extends Marionette.Behavior

	events:
		'contextmenu': 'onMenu'

	onMenu: (e) ->
		console.log @view.model.collection.where selected: true
		console.log e, @view.model.get 'file'
