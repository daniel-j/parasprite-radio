'use strict'
Sequelize = require 'sequelize'
sequelize = require '../db'

User = sequelize.define 'User',
	username:
		type: Sequelize.STRING
		unique: true
	displayName:
		type: Sequelize.STRING
	email:
		type: Sequelize.STRING
		defaultValue: null
		unique: true
	level:
		type: Sequelize.INTEGER
		defaultValue: 0
		allowNull: false
	avatarUrl:
		type: Sequelize.STRING
		defaultValue: ''
	canMakeShows:
		type: Sequelize.BOOLEAN
		defaultValue: false
		allowNull: false

UserAuth = sequelize.define 'UserAuth', {
	provider:
		type: Sequelize.STRING
		defaultValue: null

	uid:
		type: Sequelize.STRING
	username:
		type: Sequelize.STRING
	displayName:
		type: Sequelize.STRING
	email:
		type: Sequelize.STRING
	avatarUrl:
		type: Sequelize.STRING

	accessToken:
		type: Sequelize.STRING
		defaultValue: ''
		allowNull: false
	refreshToken:
		type: Sequelize.STRING
		defaultValue: ''
		allowNull: false

	UserId:
		type: Sequelize.INTEGER
		references:
			model: User
	},{
		indexes: [{
			unique: true
			fields: ['UserId', 'provider']
		}, {
			unique: true
			fields: ['uid', 'provider']
		}]
	}

Show = sequelize.define 'Show',
	name:
		type: Sequelize.STRING
		unique: true
		allowNull: false
	description:
		type: Sequelize.STRING
	twitter:
		type: Sequelize.STRING
	art:
		type: Sequelize.STRING
	url:
		type: Sequelize.STRING

	authToken:
		type: Sequelize.UUID
		unique: true
		allowNull: false
		defaultValue: Sequelize.UUIDV4

	UserId:
		type: Sequelize.INTEGER
		references:
			model: User

UserAuth.belongsTo User,
	constraints: false
	foreignKey: 'UserId'

Show.belongsTo User,
	constraints: false
	foreignKey: 'UserId'



User.sync().then () ->
	UserAuth.sync()
	Show.sync()

API =
	findById: (id, cb) ->
		User.findOne({where: {id: id}, attributes: ['id', 'username', 'displayName', 'email', 'level', 'avatarUrl', 'canMakeShows']}).then((user) ->
			cb null, user
		, cb)

	findWithAuth: (id, cb) ->
		API.findById id, (err, user) ->
			if err
				cb err
				return
			UserAuth.findAll({where: {UserId: id}, attributes: ['provider', 'username', 'displayName', 'email', 'avatarUrl']}).then((auths) ->
				cb null,
					user: user
					auths: auths
			, cb)

	handleAuth: (info, cb) ->
		UserAuth.findOne(where: { provider: info.provider, uid: info.uid }).then((userAuth) ->
			if !userAuth
				# create a new UserAuth
				userAuth = UserAuth.create(info).then((userAuth) ->
					User.create(info).then((user) ->
						userAuth.update(UserId: user.id).then((affectedCount) ->
							cb null, user && user.get(plain: true)
						, cb)
					, cb)
				, cb)
			else
				User.findOrCreate(where: {id: userAuth.UserId}, defaults: info).then((users) ->
					user = users[0]
					userAuth.update(UserId: user.id, username: info.username, displayName: info.displayName, email: info.email, avatarUrl: info.avatarUrl, accessToken: info.accessToken, refreshToken: info.refreshToken).then((affectedCount) ->
						cb null, user && user.get(plain: true)
					, cb)
				, cb)
		, cb)

	createShow: (userId, info, cb) ->
		User.findOne(where: { id: userId, canMakeShows: true }).then((user) ->
			if !user
				cb 'permission denied'
				return
			console.log user
			Show.create(info: info.info or '', description: info.description, twitter: info.twitter, art: info.art, url: info.url, UserId: user.id).then((show) ->
					cb null
				, cb)
		, cb)

	getShows: (userId, cb) ->
		Show.findAll(where: { UserId: userId }, attributes: ['id', 'name', 'description', 'twitter', 'art', 'url', 'authToken'], order: [['name', 'ASC']]).then((list) ->
			cb null, list
		, cb)

	removeShow: (userId, showId, cb) ->
		Show.destroy(where: {UserId: userId, id: showId}).then(() ->
			cb()
		, cb)

	authUserWithShow: (token, cb) ->
		Show.findOne(where: {authToken: token}).then((show) ->
			if !show
				cb 'invalid token'
				return
			API.findWithAuth show.UserId, (err, user) ->
				if err or !user or !user.user or !user.user.canMakeShows
					cb 'permission denied'
					return
				cb null, show, user.user, user.auths
		, cb)

	updateToken: (userId, showId, cb) ->
		newToken = Show.build().authToken
		Show.update({authToken: newToken}, {where: {UserId: userId, id: showId}}).then(() ->
			cb null, newToken
		, cb)

module.exports = API
