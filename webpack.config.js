'use strict'
var webpack = require('webpack')
var coffeelintStylish = require('coffeelint-stylish')

var inProduction = process.env.NODE_ENV === 'production' || process.argv.indexOf('-p') !== -1

module.exports = {
	entry: {
		main:		['./src/script/main'],
		admin:		['./src/script/admin'],
		popout:		['./src/script/popout'],
		livestream:	['./src/script/livestream']
	},
	output: {
		path: __dirname + '/',
		filename: './build/script/[name].js',
		chunkFilename: './build/script/[id].js'
	},
	module: {
		preLoaders: [
			//{ test: /\.js$/, loader: 'eslint-loader', exclude: /node_modules/ },
			//{ test: /\.coffee$/, loader: 'coffeelint-loader', exclude: /node_modules/ },
		],
		loaders: [
			{
				test: /\.js$/, loader: 'babel', exclude: /node_modules/, query: {
					sourceMaps: inProduction,
					presets: ['es2015']
				}
			},
			{ test: /\.coffee$/, loader: 'coffee-loader', exclude: /node_modules/ },
			{ test: /\.mustache$/, loader: 'mustache', exclude: /node_modules/ }
		]
	},

	coffeelint: {
		reporter: function (results) {
			//results = [].concat(results.warn, results.error)
			var self = this
			var errors = [].concat(results.error)
			var warnings = [].concat(results.warn)
			var clog = console.log
			if (errors.length > 0) {
				console.log = function (str) {self.emitError(str.replace(/^\n+|\n+$/g, ''))}
				coffeelintStylish.reporter('', errors)
			}
			if (warnings.length > 0) {
				console.log = function (str) {self.emitWarning(str.replace(/^\n+|\n+$/g, ''))}
				coffeelintStylish.reporter('', warnings)
			}
			console.log = clog
		}
	},

	resolve: {
		extensions: ['', '.coffee', '.js', '.json', '.mustache'],
		root: [__dirname+'/src/script'],

		alias: {
			'underscore': 'lodash'
		}
	},

	plugins: [

		new webpack.ProvidePlugin({
			// Detect and inject
			$: 'jquery',
			Backbone: 'backbone',
			_: 'underscore',
			Marionette: 'backbone.marionette',
			m: 'mithril'
		})
	],

	devtool: 'inline-source-map',
	debug: true
}
