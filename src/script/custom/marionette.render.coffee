

Marionette.Renderer.render = (template, data) ->

	(template  && template.render) || throwError("Cannot render the template since its false, "+
		"null or undefined.","TemplateNotFoundError")

	template.render data
