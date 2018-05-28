
if !window.Base then window.Base = Base = {}

class Base.Controller extends Marionette.Controller

	constructor: (options = {}) ->
		super options
		@region = options.region or App.request "default:region"
		@_instance_id = _.uniqueId("controller")
		App.execute "register:instance", @, @_instance_id

	close: (args...) ->
		delete @region
		delete @options
		super args
		App.execute "unregister:instance", @, @_instance_id

	show: (view, options = {}) ->
		_.defaults options,
			loading: false
			region: @region

		@_setMainView view
		@_manageView view, options

	_setMainView: (view) ->
		return if @_mainView
		@_mainView = view
		@listenTo view, "close", @close

	_manageView: (view, options) ->
		if options.loading
			App.execute "show:loading", view, options
		else
			options.region?.show view
