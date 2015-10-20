Sequelize = require 'sequelize'
config = require __dirname + '/../scripts/config'
sequelize = new Sequelize config.mysql.database, config.mysql.user, config.mysql.password,
	host: config.mysql.host
	logging: false
	define:
		charset: 'utf8'
	language: 'en'

module.exports = sequelize
