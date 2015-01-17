# Source: https://github.com/simonblee/marionette-dust

Backbone.Marionette.Renderer.render = (template, data) ->

	template || throwError("Cannot render the template since its false, "+
		"null or undefined.","TemplateNotFoundError");

	html = null
	# Template must be compiled and in the dust cache. Recommend pre-compiling
	# and loading the templates as scripts at app start.
	dust.render template, data, (err, out) ->
		if err
			console.error err
			html = err
		else
			html = out;
	
	html
