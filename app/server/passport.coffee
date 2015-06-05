TwitterStrategy = require('passport-twitter').Strategy
OAuth2Strategy = require('passport-oauth2').Strategy
User = require __dirname+'/models/user'
config = require __dirname + '/../util/config'
fetchJSON = require __dirname + '/../util/fetchJSON'

module.exports = (passport) ->

	# used to serialize the user for the session
	passport.serializeUser (user, done) ->
		#console.log "SERIALIZE", user.id
		done null, user.id

	# used to deserialize the user
	passport.deserializeUser (id, done) ->
		#console.log "UNSERIALIZE", id
		User.findById id, (err, user) ->
			done err, user

	processUser = (userProfile, done) ->
		User.findById userProfile.id, (err, user) ->
			if err
				done err, null

			else if user
				# user exists, update it
				User.update userProfile, (err, user) ->
					done err, user

			else
				# if there is no user, create it
				User.add userProfile, (err, user) ->
					done err, user


	poniverse = new OAuth2Strategy config.passport.poniverse, (accessToken, refreshToken, profile, done) ->

		fetchJSON "https://api.poniverse.net/v1/users/me?access_token="+accessToken, (err, data) ->
			if err
				done err, null
				return

			userProfile =
				id: data.id
				token: accessToken
				username: data.username
				displayName: data.display_name
				level: 0
				image: ""
				strategy: 'poniverse'

			processUser userProfile, done

	poniverse.name = 'poniverse' # replace 'oauth2'
	passport.use poniverse

	passport.use new TwitterStrategy config.passport.twitter, (token, tokenSecret, profile, done) ->

		userProfile =
			id: profile.id
			token: token
			username: profile.username
			displayName: profile.displayName
			level: 0
			image: profile.photos[0].value
			strategy: 'twitter'

		process.nextTick ->
			processUser userProfile, done

