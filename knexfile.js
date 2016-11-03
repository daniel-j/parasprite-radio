const path = require('path')
const config = require(path.join(__dirname, 'scripts/config'))

module.exports = {
  client: 'mysql',
  connection: {
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    charset: 'utf8'
  },
  debug: false
}
