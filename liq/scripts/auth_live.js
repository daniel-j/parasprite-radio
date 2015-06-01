#!/usr/bin/env node
'use strict'

// format: [ {"username": "", "password": "", "display_name": "", "twitter": "", "avatar": "url"}, ... ]
var users = require(__dirname+'/auth_users.json')

var username = process.argv[2]
var password = process.argv[3]

if (username === 'source') {
	var pos = password.indexOf('/')
	username = password.substring(0, pos)
	password = password.substring(pos+1)
}

var user = null

for (var i = 0; i < users.length; i+=1) {
	var u = users[i]
	if (u.password === password && u.username.toLowerCase() === username.toLowerCase()) {
		user = u
		break
	}
}

if (user) {
	console.log(JSON.stringify({
		live_username: user.username,
		live_displayname: user.display_name,
		live_twitter: user.twitter,
		art: user.avatar
	}))
} else {
	console.log(JSON.stringify({error: "Invalid username or password: "+username+" "+password}))
}
