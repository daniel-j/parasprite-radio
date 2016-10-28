const fs = require('fs')
const toml = require('toml')
const path = require('path')
const filename = path.join(__dirname, '../config.toml')

let config

try {
  config = toml.parse(fs.readFileSync(filename))
} catch (e) {
  throw new Error('config.toml parse error: ' + e)
}

module.exports = config
