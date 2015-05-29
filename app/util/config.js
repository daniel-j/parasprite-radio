var fs = require('fs')
var toml = require('toml')
var filename = __dirname+"/../../config.toml"

module.exports = toml.parse(fs.readFileSync(filename))
