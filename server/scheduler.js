
import schedule from 'node-schedule'
import { google } from 'googleapis'
import { EventEmitter } from 'events'
import config from '../scripts/config'

const calendar = google.calendar({version: 'v3', auth: config.google.apiKey})
let fetchDelay = 10 * 1000

let eventsMap = {}
let eventsJobs = {}
const scheduler = new EventEmitter()

function sortStartTime (a, b) {
  return a.start.getTime() - b.start.getTime()
}

function fetchCalendar () {
  let now = Date.now()
  calendar.events.list({
    calendarId: config.google.calendarId,
    maxResults: 100, // default is 250
    timeMin: new Date(now - 10 * 60 * 1000).toISOString(),
    timeMax: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
    singleEvents: true
  }, (err, {data}) => {
    if (err) {
      console.error('Scheduler: Error fetching events')
      console.error(err)
      return
    }
    now = Date.now()
    let idlist = []
    for (let item of data.items) {
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

      ev.length = (ev.end.getTime() - ev.start.getTime()) / 1000

      if (ev.end.getTime() >= now) {
        handleEvent(ev)
        idlist.push(item.id)
      }
    }

    handleDeleted(idlist)
    // updated = new Date(data.updated)
    // console.log('Last updated:', updated
  })
}

function handleEvent (ev) {
  let id = ev.id
  if (eventsMap[id]) {
    let hasStartTimeChanged = eventsMap[id].start.getTime() !== ev.start.getTime()
    let hasEndTimeChanged = eventsMap[id].end.getTime() !== ev.end.getTime()
    if (hasStartTimeChanged || hasEndTimeChanged) {
      console.log('Scheduler: Changed event', id)
      if (eventsJobs[id]) {
        eventsJobs[id].start.cancel()
        eventsJobs[id].start = schedule.scheduleJob(ev.start, eventStarted.bind(null, ev))
        eventsJobs[id].end.cancel()
        eventsJobs[id].end = schedule.scheduleJob(ev.end, eventEnded.bind(null, ev))
      }
    }
  } else {
    console.log('Scheduler: Added event', id)
    eventsJobs[id] = {
      start: schedule.scheduleJob(ev.start, eventStarted.bind(null, ev)),
      end: schedule.scheduleJob(ev.end, eventEnded.bind(null, ev))
    }
  }
  eventsMap[id] = ev // add or just overwrite the old one! =D
}

function handleDeleted (idlist) {
  let now = Date.now()
  for (let id in eventsMap) {
    let ev = eventsMap[id]
    let end = ev.end.getTime()
    let inList = idlist.indexOf(id) !== -1
    if (end < now || !inList) {
      console.log('Scheduler: Deleted event', id)
      if (eventsJobs[id]) {
        eventsJobs[id].start.cancel()
        eventsJobs[id].end.cancel()
        delete eventsJobs[id]
      }
      delete eventsMap[id]
    }
  }
}

function eventStarted (ev) {
  // let diff = (Date.now()-ev.start.getTime())/1000
  eventsJobs[ev.id].start.cancel()
  if (Date.now() - ev.start.getTime() < 10 * 1000) {
    console.log('Scheduler: Event started!!', ev.title)
    scheduler.emit('started', ev)
  }
}

function eventEnded (ev) {
  // let diff = (Date.now()-ev.start.getTime())/1000
  eventsJobs[ev.id].end.cancel()
  if (Date.now() - ev.end.getTime() < 10 * 1000) {
    console.log('Scheduler: Event ended!!', ev.title)
    scheduler.emit('ended', ev)
  }
}

scheduler.fetchCalendar = fetchCalendar

scheduler.initialize = function () {
  if (config.google.apiKey) {
    console.log('Initializing Scheduler...')
    fetchCalendar()
    setInterval(fetchCalendar, fetchDelay)
  } else {
    console.warn('Warning: No Google API key. Disabling Google Calendar fetching.')
  }
}

scheduler.getEvents = function () {
  let now = Date.now()
  let upcoming = []
  let ongoing = []
  for (let id in eventsMap) {
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

export default scheduler
