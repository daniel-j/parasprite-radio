Sequelize = require 'sequelize'
sequelize = require '../db'

User = sequelize.define 'User',
	username:
		type: Sequelize.STRING
	displayName:
		type: Sequelize.STRING
	email:
		type: Sequelize.STRING
		default: null
		unique: true
	level:
		type: Sequelize.INTEGER
		default: 0
	avatarUrl:
		type: Sequelize.STRING
		default: ''

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


#User.sync(force: true).then () ->
#	UserAuth.sync(force: true)

API =
	findById: (id, cb) ->
		User.findById(id).then((user) ->
			cb null, user
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

module.exports = API
