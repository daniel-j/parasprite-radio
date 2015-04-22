@App.module 'Util', (Util, App, Backbone, Marionette, $, _) ->
	
	zf = (v) ->
		if v > 9
			""+v;
		else
			"0"+v;

	readableTime = (timems, ignoreMs) ->
		time = timems|0
		if time < 3600
			(time / 60|0)+":"+zf(time % 60)
		else
			(time / 3600|0)+":"+zf((time % 3600)/60|0)+":"+zf((time % 3600)%60)
	
	App.reqres.setHandler "format:time", (s) ->
		readableTime s


	App.commands.setHandler "queue:track", (track) ->
		path = track.get 'file'
		$.ajax
			url: config.apiPath+"/queue/add/"+encodeURI(path).replace(/#/, "%23")

