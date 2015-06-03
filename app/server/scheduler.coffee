
schedule = require 'node-schedule'
googleapis = require 'googleapis'
calendar = googleapis.calendar 'v3'
EventEmitter = require('events').EventEmitter

fetchDelay = 10*1000

module.exports = (config) ->

	eventsMap = {}
	eventsJobs = {}
	ee = new EventEmitter

	fetchCalendar = () ->
		now = Date.now()
		calendar.events.list(
			calendarId: config.google.calendarId
			auth: config.google.apiKey
			#maxResults: 100, # default is 250
			timeMin: new Date(now-5*60*1000).toISOString()
			timeMax: new Date(now+60*60*1000).toISOString()
			singleEvents: true
		, (err, raw) ->
			if err
				console.log 'Schedule: Error fetching events'
				console.log err
			else
				now = Date.now()
				idlist = []
				for item, i in raw.items
					item = raw.items[i]
					if item.visibility == 'private' then continue
					ev =
						id: item.id
						htmlLink: item.htmlLink
						created: new Date item.created
						updated: new Date item.updated

						title: item.summary
						location: item.location
						description: item.description

						start: new Date(item.start.dateTime || item.start.date)
						end: new Date(item.end.dateTime || item.end.date)

						sequence: item.sequence
					
					ev.length = (ev.end.getTime()-ev.start.getTime())/1000
					
					if ev.end.getTime() >= now
						handleEvent ev
						idlist.push item.id

				handleDeleted idlist
				#updated = new Date(raw.updated)
				#console.log "Last updated:", updated
		)

	handleEvent = (ev) ->
		id = ev.id
		if eventsMap[id]
			hasStartTimeChanged = eventsMap[id].start.getTime() != ev.start.getTime()
			hasEndTimeChanged = eventsMap[id].end.getTime() != ev.end.getTime()
			if hasStartTimeChanged or hasEndTimeChanged
				console.log "Schedule: Changed event", id
				if eventsJobs[id]
					eventsJobs[id].start.cancel()
					eventsJobs[id].start = schedule.scheduleJob(ev.start, eventStarted.bind(null, ev))
					eventsJobs[id].end.cancel()
					eventsJobs[id].end = schedule.scheduleJob(ev.end, eventEnded.bind(null, ev))
		else
			console.log "Schedule: Added event", id
			eventsJobs[id] =
				start: schedule.scheduleJob(ev.start, eventStarted.bind(null, ev))
				end:  schedule.scheduleJob(ev.end, eventEnded.bind(null, ev))
		eventsMap[id] = ev # add or just overwrite the old one! =D

	handleDeleted = (idlist) ->
		now = Date.now()
		for id, ev of eventsMap
			ev = eventsMap[id]
			end = ev.end.getTime()
			inList = idlist.indexOf(id) != -1
			if end < now || !inList
				console.log "Schedule: Deleted event", id
				if eventsJobs[id]
					eventsJobs[id].start.cancel()
					eventsJobs[id].end.cancel()
					delete eventsJobs[id]
				delete eventsMap[id];


	eventStarted = (ev) ->
		#var diff = (Date.now()-ev.start.getTime())/1000
		eventsJobs[ev.id].start.cancel()
		if Date.now()-ev.start.getTime() < 10*1000
			console.log "Schedule: Event started!!", ev.title
			ee.emit 'started', ev

	eventEnded = (ev) ->
		#var diff = (Date.now()-ev.start.getTime())/1000
		eventsJobs[ev.id].end.cancel()
		if Date.now()-ev.end.getTime() < 10*1000
			console.log "Schedule: Event ended!!", ev.title
			ee.emit 'ended', ev


	fetchCalendar()
	setInterval fetchCalendar, fetchDelay

	ee
