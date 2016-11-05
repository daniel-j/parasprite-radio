const fs = require('fs')
const toml = require('toml')
const path = require('path')
const filename = path.join(__dirname, '../conf/radio.toml')

let config

try {
  config = toml.parse(fs.readFileSync(filename))
} catch (e) {
  throw new Error('radio.toml parse error: ' + e)
}

module.exports = config
