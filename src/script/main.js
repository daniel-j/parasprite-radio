/* global google */
'use strict'

import m from 'mithril'
import './incl/radioinfo'
import radioPlayer from './incl/radioplayer'
import livestream from './livestream'
import { formattime, timeago } from './utils/time'
import api from './entities/api'
import './incl/snow'
import dateFormat from 'dateformat-light'
import jstz from 'jstz'

const radio = radioPlayer({
  baseurl: window.config.general_streamurl,
  autoplay: false
})

radio.activate()

let menudiv = document.getElementById('mainmenu')
let scheduleiframe = document.getElementById('scheduleiframe')

let currentPage = 'pageHistory'
let oldmenu = document.getElementById('menuHistory')

function initialize () {
  let hashMatch = document.querySelector('[data-hash="' + document.location.hash.substr(1) + '"]')
  if (hashMatch) {
    document.location.hash = ''
    if (history) {
      history.replaceState('', document.title, window.location.pathname)
    }
    hashMatch.click()
  }
}

api.user.fetch().then(function () {
  let info = api.user.get()

  if (info.user) {
    let user = info.user
    document.getElementById('body').classList.add('loggedin')
    document.getElementById('inputAccountUsername').value = user.username
    document.getElementById('inputAccountDisplayName').value = user.displayName
    document.getElementById('inputAccountEmail').value = user.email
    document.getElementById('accountAvatar').src = document.getElementById('inputAccountAvatarUrl').value = user.avatarUrl

    document.getElementById('inputAccountAvatarUrl').addEventListener('change', function () {
      document.getElementById('accountAvatar').src = this.value
    }, false)

    if (user.level >= 5) {
      document.getElementById('body').classList.add('isadmin')
    }
    document.getElementById('editAccountForm').addEventListener('submit', function (e) {
      e.preventDefault()
    }, false)
  }
  initialize()
})

document.getElementById('popuplink').addEventListener('click', function (e) {
  e.preventDefault()
  radio && radio.stopRadio()
  window.open('/popout', 'parasprite-radio-popout', 'width=450,height=240,left=300,top=100')
  return false
}, false)

// History
let playHistory = {}
playHistory.controller = function () {
  api.history.startTimer()
  this.trackList = api.history.get
  this.openUrl = function (url) {
    window.open(url, '_blank')
  }
}
playHistory.view = function (ctrl) {
  return [
    m('div.headline', 'Recently played'),
    m('div', ctrl.trackList().map(function (track) {
      if (!track.timestamp) {
        return null
      }
      return m('div.row', {key: track.timestamp + track.text, onclick: m.withAttr('data-url', ctrl.openUrl), 'data-url': track.url}, [
        m('div.img', m('img', {src: track.art})),
        m('div.content', [m('div.title', track.title), m('div.artist', track.artist + (track.album ? ' (' + track.album + ')' : ''))]),
        !track.timestamp ? m('div.right', 'Now playing') : m('div.right', {title: dateFormat(new Date(track.timestamp * 1000))}, [
          m('div.timeago', timeago(Date.now() / 1000 - track.timestamp, true)),
          m('div.timestamp', dateFormat(new Date(track.timestamp * 1000), 'd mmm HH:MM'))
        ])
      ])
    }))
  ]
}
m.mount(document.getElementById('playhistory'), playHistory)

/*
// Playlist
let playlist = document.getElementById('playlist')
let playlisthours = document.getElementById('playlisthours')
let playlistcount = document.getElementById('playlistcount')
let rawlist = null

function updatePlaylist() {
  xhr('playlist.json?timestamp='+Date.now(), function (res) {

    let data

    try {
      data = JSON.parse(res)
    } catch (e) {
      console.log(res)
      data = {}
      return
    }

    rawlist = data

    while (playlist.childNodes.length > 0) {
      playlist.removeChild(playlist.firstChild)
    }
    let totaltime = 0
    for (let i = 0; i < data.length; i++) {
      let track = data[i]
      totaltime += +track.time

      let row = playlist.insertRow(-1)
      row.dataset.url = 'http://www.last.fm/search?q='+encodeURIComponent(track.title+' '+track.artist)

      let titlecell = row.insertCell(-1)
      let artistcell = row.insertCell(-1)
      //let albumcell = row.insertCell(-1)

      titlecell.textContent = track.title
      artistcell.textContent = track.artist
      //albumcell.textContent = track.album

    }
    playlisthours.textContent = Math.round(totaltime/(60*60))
    playlistcount.textContent = data.length
  })
}

playlist.addEventListener('click', function (e) {
  let node = e.target
  while (node.parentNode !== playlist) {
    node = node.parentNode
  }
  window.open(node.dataset.url, '_blank')
}, false)

function encode(s) {
  return encodeURIComponent(s||'').replace(/\%20/g, '+')
}

function toSpotifyPlaylist() {
  let list = []
  for (let i = 0; i < rawlist.length; i++) {
    let track = rawlist[i]
    list.push('spotify:local:'+encode(track.artist)+':'+encode(track.album)+':'+encode(track.title)+':'+track.time)
  }
  console.log(list.join('\n'))
}

window.toSpotifyPlaylist = toSpotifyPlaylist
*/

// Schedule
let tz = jstz.determine()
let timezone = tz.name()

let bgcolor = '444444'
let color = '8C500B'

scheduleiframe.src = 'https://www.google.com/calendar/embed?mode=WEEK&showTitle=0&showCalendars=0&height=350&wkst=2&bgcolor=%23' + bgcolor + '&src=' + window.config.google_calendarId + '&color=%23' + color + '&ctz=' + encodeURIComponent(timezone)

// reload every 5 min
setInterval(function () {
  scheduleiframe.src += ''
}, 5 * 60 * 1000)

// Map
let map
let mapmarkers = {}
function fetchMap () {
  return m.request({method: 'GET', url: '/api/listeners'})
}
function updateMap () {
  fetchMap().then(function (list) {
    let idlist = []
    for (let i = 0; i < list.length; i++) {
      let l = list[i]
      l.id = l.location.lng + ',' + l.location.lat + ',' + l.ip
      idlist[i] = l.id
      let content = '<div style="color: black">IP: ' + l.ip + '<br>Mount: ' + l.mount + '<br>Country: ' + l.location.countryName + '<br>Region: ' + l.location.regionName + '<br>City: ' + l.location.cityName + '<br>Connected at ' + new Date(l.connected * 1000) + '<br>Time connected: ' + formattime(Date.now() / 1000 - l.connected) + '<br>User Agent: ' + l.userAgent + '</div>'
      if (mapmarkers[l.id]) {
        mapmarkers[l.id].infowindow.setContent(content)
        continue
      }
      let mark = new google.maps.Marker({
        position: new google.maps.LatLng(+l.location.lat, +l.location.lng),
        map: map,
        animation: google.maps.Animation.DROP
      })
      mark.infowindow = new google.maps.InfoWindow({
        content: content
      })
      mark.addListener('click', markClick)
      mapmarkers[l.id] = mark
    }
    for (let i in mapmarkers) {
      if (idlist.indexOf(i) === -1) {
        let mark = mapmarkers[i]
        mark.setMap(null)
        google.maps.event.clearListeners(mark)
        delete mapmarkers[i]
      }
    }
  })
}
function markClick () {
  this.infowindow.open(map, this)
}
function initMap () {
  map = new google.maps.Map(document.getElementById('googlemap'), {
    zoom: 2,
    center: {lat: 25, lng: 12}
  })
  window.addEventListener('resize', function () {
    let center = map.getCenter()
    google.maps.event.trigger(map, 'resize')
    map.setCenter(center)
  }, false)

  setInterval(updateMap, 5 * 1000)
  updateMap()
}
window.initMap = initMap

document.getElementById('togglechat').addEventListener('click', function () {
  document.body.classList.toggle('chatfullscreen')
  if (document.body.classList.contains('chatfullscreen')) {
    livestream.enable()
  } else if (currentPage !== 'pageLivestream') {
    livestream.disable()
  }
}, false)
document.getElementById('reloadchat').addEventListener('click', function () {
  document.getElementById('chat').src += ''
}, false)

menudiv.addEventListener('click', function (e) {
  let newmenu = e.target
  if (!newmenu.dataset.page && !newmenu.dataset.url) {
    return
  }
  if (newmenu.dataset.url) {
    window.open(newmenu.dataset.url, '_blank')
  } else {
    oldmenu.className = ''
    newmenu.className = 'current'
    oldmenu = newmenu
    document.getElementById(currentPage).style.display = 'none'
    currentPage = newmenu.dataset.page
    document.getElementById(currentPage).style.display = 'block'

    if (currentPage === 'pageMap' && !map) {
      let gmap = document.createElement('script')
      gmap.src = '//maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(window.config.google_publicApiKey) + '&callback=initMap'
      document.body.appendChild(gmap)
      map = true
    } else if (currentPage === 'pageMap') {
      google.maps.event.trigger(map, 'resize')
    }

    if (currentPage === 'pageLivestream') {
      livestream.enable()
    } else {
      livestream.disable()
    }
  }
}, false)
