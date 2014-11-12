mysql = require 'mysql'
config = require __dirname + '/../../config.json'
dbpool = mysql.createPool config.mysql

module.exports = dbpool