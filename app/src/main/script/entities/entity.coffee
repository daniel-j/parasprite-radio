@App.module "Entity", (Entity, App, Backbone, Marionette, $, _) ->
	


	class Entity.LiqInfo extends Backbone.Model
		url: ->
			config.apiPath+'/now/json'

		defaults:
			title: ''
			artist: ''
			albumartist: null
			album: null
			url: null
			year: null

	class Entity.IceInfo extends Backbone.Model
		url: ->
			config.apiPath+'/now/json'
	