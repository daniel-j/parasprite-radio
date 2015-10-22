class Behavior.TracklistSelect extends Marionette.Behavior

	initialize: ->
		@canUp = false

		@listenTo @view, 'childview:mousedown:row', @rowMouseDown
		@listenTo @view, 'childview:mouseup:row', @rowMouseUp

	rowMouseDown: (view, e) ->
		@canUp = false
		model = view.model
		col = model.collection

		if e.target.nodeName == 'A' or model.has 'directory'
			return

		if e.ctrlKey or e.metaKey
			model.set 'selected', !model.get 'selected'
			col.lastSelectedModel = model
			e.preventDefault()
			console.log 'ctrl'
		else if e.shiftKey
			@rangeSelection model
			e.preventDefault()
			console.log 'shift'
		else if !model.get 'selected'
			@clearSelection model.collection
			model.set 'selected', true
			col.lastSelectedModel = model
			console.log 'a'
		else
			@canUp = true
			col.lastSelectedModel = model
			console.log 'b'

	rowMouseUp: (view, e) ->
		unless @canUp then return
		@clearSelection view.model.collection
		view.model.set 'selected', true

	clearSelection: (col) ->
		for m in col.models
			m.set 'selected', false

	rangeSelection: (m1) ->
		col = m1.collection
		m2 = col.lastSelectedModel

		index1 = col.models.indexOf m1
		index2 = col.models.indexOf m2
		if index1 == -1 then return
		if index2 == -1 then index2 = 0
		low = Math.min index1, index2
		high = Math.max index1, index2

		@clearSelection col
		for i in [low..high]
			m = col.at i
			if m.has 'file'
				m.set 'selected', true


class Behavior.TrackSelect extends Marionette.Behavior
	events:
		'mousedown': 'mouseDown'
		'mouseup': 'mouseUp'

	modelEvents:
		'change:selected': 'selectedChanged'

	mouseDown: (e) ->
		@view.trigger 'mousedown:row', e

	mouseUp: (e) ->
		if e.button == 0
			@view.trigger 'mouseup:row', e

	selectedChanged: ->
		if @view.model.get 'selected'
			@view.$el.addClass 'selected'
		else
			@view.$el.removeClass 'selected'
