var fs = require('fs')
var toml = require('toml')
var filename = __dirname+"/../config.toml"

var config

try {
	config = toml.parse(fs.readFileSync(filename))
} catch (e) {
	throw "config.toml parse error: " + e
}


module.exports = config
