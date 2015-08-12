mysql = require 'mysql'
config = require __dirname + '/../scripts/config'
dbpool = mysql.createPool config.mysql

module.exports = dbpool
