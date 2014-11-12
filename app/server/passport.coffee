TwitterStrategy = require('passport-twitter').Strategy
User = require __dirname+'/models/user'
config = require __dirname + '/../../config.json'

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

	passport.use new TwitterStrategy config.twitter, (token, tokenSecret, profile, done) ->

		userProfile =
			id: profile.id
			token: token
			username: profile.username
			displayName: profile.displayName
			level: 0
			image: profile.photos[0].value

		process.nextTick ->
			User.findById profile.id, (err, user) ->
				
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

	
