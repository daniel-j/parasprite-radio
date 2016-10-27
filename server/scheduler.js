
import schedule from 'node-schedule'
import { calendar as GoogleCalendar } from 'googleapis'
import { EventEmitter } from 'events'

const calendar = GoogleCalendar('v3')
let fetchDelay = 10*1000

export default function (config) {

	let eventsMap = {}
	let eventsJobs = {}
	const ee = new EventEmitter

	function sortStartTime(a, b) {
		return a.start.getTime() - b.start.getTime()
	}

	function fetchCalendar() {
		let now = Date.now()
		calendar.events.list({
			calendarId: config.google.calendarId,
			auth: config.google.apiKey,
			//maxResults: 100, // default is 250
			timeMin: new Date(now-10*60*1000).toISOString(),
			timeMax: new Date(now+24*60*60*1000).toISOString(),
			singleEvents: true
		}, function (err, raw) {
			if (err) {
				console.log('Schedule: Error fetching events')
				console.log(err)
			} else {
				now = Date.now()
				let idlist = []
				for (let item of raw.items) {
					if (item.visibility === 'private') {
						continue
					}
					let ev = {
						id: item.id,
						htmlLink: item.htmlLink,
						created: new Date(item.created),
						updated: new Date(item.updated),

						title: item.summary,
						location: item.location,
						description: item.description,

						start: new Date(item.start.dateTime || item.start.date),
						end: new Date(item.end.dateTime || item.end.date),

						sequence: item.sequence
					}

					ev.length = (ev.end.getTime()-ev.start.getTime())/1000

					if (ev.end.getTime() >= now) {
						handleEvent(ev)
						idlist.push(item.id)
					}
				}

				handleDeleted(idlist)
				//updated = new Date(raw.updated)
				//console.log('Last updated:', updated
			}
		})
	}

	function handleEvent(ev) {
		let id = ev.id
		if (eventsMap[id]) {
			let hasStartTimeChanged = eventsMap[id].start.getTime() !== ev.start.getTime()
			let hasEndTimeChanged = eventsMap[id].end.getTime() !== ev.end.getTime()
			if (hasStartTimeChanged || hasEndTimeChanged) {
				console.log('Schedule: Changed event', id)
				if (eventsJobs[id]) {
					eventsJobs[id].start.cancel()
					eventsJobs[id].start = schedule.scheduleJob(ev.start, eventStarted.bind(null, ev))
					eventsJobs[id].end.cancel()
					eventsJobs[id].end = schedule.scheduleJob(ev.end, eventEnded.bind(null, ev))
				}
			}
		} else {
			console.log('Schedule: Added event', id)
			eventsJobs[id] = {
				start: schedule.scheduleJob(ev.start, eventStarted.bind(null, ev)),
				end:  schedule.scheduleJob(ev.end, eventEnded.bind(null, ev))
			}
		}
		eventsMap[id] = ev // add or just overwrite the old one! =D
	}

	function handleDeleted(idlist) {
		let now = Date.now()
		for (let id in eventsMap) {
			let ev = eventsMap[id]
			let end = ev.end.getTime()
			let inList = idlist.indexOf(id) !== -1
			if (end < now || !inList) {
				console.log('Schedule: Deleted event', id)
				if (eventsJobs[id]) {
					eventsJobs[id].start.cancel()
					eventsJobs[id].end.cancel()
					delete eventsJobs[id]
				}
				delete eventsMap[id]
			}
		}
	}


	function eventStarted(ev) {
		//var diff = (Date.now()-ev.start.getTime())/1000
		eventsJobs[ev.id].start.cancel()
		if (Date.now()-ev.start.getTime() < 10*1000) {
			console.log('Schedule: Event started!!', ev.title)
			ee.emit('started', ev)
		}
	}

	function eventEnded(ev) {
		//var diff = (Date.now()-ev.start.getTime())/1000
		eventsJobs[ev.id].end.cancel()
		if (Date.now()-ev.end.getTime() < 10*1000) {
			console.log('Schedule: Event ended!!', ev.title)
			ee.emit('ended', ev)
		}
	}


	if (config.google.apiKey) {
		fetchCalendar()
		setInterval(fetchCalendar, fetchDelay)
	} else {
		console.warn("Warning: No Google API key. Disabling Google Calendar fetching.")
	}

	ee.getEvents = function () {
		let now = Date.now()
		let upcoming = []
		let ongoing = []
		for (id in eventsMap) {
			let ev = eventsMap[id]
			let start = ev.start.getTime()
			let end = ev.end.getTime()

			if (end > now) {
				if (start < now) {
					ongoing.push(ev)
				} else {
					upcoming.push(ev)
				}
			}
		}

		ongoing.sort(sortStartTime)
		upcoming.sort(sortStartTime)

		if (upcoming.length > 5) {
			upcoming.length = 5
		}

		return {
			ongoing: ongoing,
			upcoming: upcoming
		}
	}

	return ee

}
