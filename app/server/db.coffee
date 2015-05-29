mysql = require 'mysql'
config = require __dirname + '/../util/config'
dbpool = mysql.createPool config.mysql

module.exports = dbpool
