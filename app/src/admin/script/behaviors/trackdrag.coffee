class Behavior.TrackDrag extends Marionette.Behavior
	events:
		dragstart: 'start'
		dragenter: 'enter'
		dragleave: 'leave'
		dragend: 'leave'
		dragover: 'over'
		drop: 'drop'

	start: (e) ->

		# can only drag from something selected
		unless @view.model.get 'selected' then return

		models = []
		files = []
		for model in @view.model.collection.models
			if model.get 'selected'
				models.push model
				files.push model.get 'file'

		if models.length == 0
			return

		m = models[0]


		console.log 'start drag'
		if e.originalEvent then e = e.originalEvent

		e.dataTransfer.effectAllowed = "copyMove"
		e.dataTransfer.dropEffect = "copy"
		e.dataTransfer.setData 'files', JSON.stringify files

		# create tooltip
		if models.length == 1
			text = m.get('title')+' - '+m.get('artist')
		else
			text = models.length+' tracks'
		h = 14
		font = 'bold '+h+'px sans-serif'
		canvas = document.createElement 'canvas'
		ctx = canvas.getContext '2d'

		ctx.font = font
		w = ctx.measureText(text).width
		canvas.width = w+20
		canvas.height = h+8

		ctx.fillStyle = 'white'
		ctx.fillRect 0, 0, canvas.width, canvas.height

		ctx.fillStyle = 'black'
		ctx.textBaseline = 'middle'
		ctx.font = font

		ctx.fillText text, 10, canvas.height/2
		img = new Image()
		img.src = canvas.toDataURL()
		e.dataTransfer.setDragImage img, 0, 0

	enter: (e) ->
		e.preventDefault()
		@$el.addClass @overClass

	leave: (e) ->
		e.preventDefault()
		@$el.removeClass @overClass

	over: (e) ->
		e.preventDefault()
		return false

	drop: (e) ->
		e.preventDefault()
		@leave e
		#currentIndex = @$el.index()

		#@model.collection.remove @parent.draggedModel
		#@model.collection.add @parent.draggedModel, at: currentIndex

		#@trigger 'drop', @parent.draggedModel