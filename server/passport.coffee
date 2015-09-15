TwitterStrategy = require('passport-twitter').Strategy
OAuth2Strategy = require('passport-oauth2').Strategy
User = require __dirname+'/models/user'
config = require __dirname + '/../scripts/config'
fetchJSON = require(__dirname + '/../scripts/fetcher').fetchJSON

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


	poniverse = new OAuth2Strategy config.passport.poniverse, (accessToken, refreshToken, profile, done) ->
		provider = 'poniverse'
		fetchJSON "https://api.poniverse.net/v1/users/me?access_token="+accessToken, null, (err, data) ->
			if err
				done err, null
				return

			console.log accessToken, refreshToken


			userInfo =
				provider: provider
				accessToken: accessToken
				refreshToken: refreshToken
				uid: data.id

				username: data.username
				displayName: data.display_name
				email: data.email
				level: 0
				avatarUrl: ""

			User.handleAuth userInfo, done

	poniverse.name = 'poniverse' # replace 'oauth2'
	passport.use poniverse

	passport.use new TwitterStrategy config.passport.twitter, (accessToken, refreshToken, profile, done) ->
		provider = 'twitter'

		userInfo =
			provider: provider
			accessToken: accessToken
			refreshToken: refreshToken
			uid: profile.id

			username: profile.username
			displayName: profile.displayName
			level: 0
			avatarUrl: profile.photos[0].value

		process.nextTick ->
			User.handleAuth userInfo, done

