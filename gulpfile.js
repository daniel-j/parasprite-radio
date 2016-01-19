'use strict'

var config = require('./scripts/config')
var simpleconfig = require('./scripts/simpleconfig')

// gulp and utilities
var gulp = require('gulp')
var sourcemaps = require('gulp-sourcemaps')
var gutil = require('gulp-util')
var gdata = require('gulp-data')
var del = require('del')
var gulpif = require('gulp-if')
var plumber = require('gulp-plumber')
var cssnano = require('gulp-cssnano')
var mergeStream = require('merge-stream')
var assign = require('lodash').assign
var browserSync = require('browser-sync').create()
var sequence = require('run-sequence').use(gulp)
var watch = require('gulp-watch')
var lazypipe = require('lazypipe')

// script
var eslint = require('gulp-eslint')
var coffeelint = require('gulp-coffeelint')
var webpack = require('webpack')
var webpackConfig = require('./webpack.config.js')

// style
var stylus = require('gulp-stylus')
var nib = require('nib')

// document
var jade = require('gulp-jade')
var htmlmin = require('gulp-htmlmin')


var sources = {
	//script: ['main.js', 'admin.coffee', 'popout.js', 'livestream.js'],
	style: ['main.styl', 'admin.styl', 'popout.styl', 'livestream.styl'],
	document: ['index.jade', 'admin.jade', 'popout.jade', 'livestream.jade']
}
var lintES = ['src/script/**/*.js', 'server/**/*.js', 'scripts/**/*.js', 'liq/scripts/**/*.js', 'gulpfile.js', 'webpack.config.js']
var lintCS = ['src/script/**/*.coffee', 'server/**/*.coffee']


var inProduction = process.env.NODE_ENV === 'production' || process.argv.indexOf('-p') !== -1


var eslintOpts = {
	envs: ['browser', 'node'],
	rules: {
		'strict': 0,
		'semi': [1, 'never'],
		'quotes': [1, 'single'],
		'space-infix-ops': [0, {'int32Hint': true}],
		'no-empty': 0
	}
}

var stylusOpts = {
	use: nib,
	compress: inProduction
}
var cssnanoOpts = {

}

var jadeOpts = {
	pretty: !inProduction
}

var htmlminOpts = {
	collapseWhitespace: true,
	removeComments: true,
	removeAttributeQuotes: true,
	collapseBooleanAttributes: true,
	removeRedundantAttributes: true,
	removeEmptyAttributes: true,
	removeScriptTypeAttributes: true,
	removeStyleLinkTypeAttributes: true
}

var watchOpts = {
	readDelay: 500,
	verbose: true
}

if (inProduction) {
	webpackConfig.plugins.push(new webpack.optimize.DedupePlugin())
	webpackConfig.plugins.push(new webpack.optimize.OccurenceOrderPlugin(false))
	webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
		compress: {
			warnings: false,
			screw_ie8: true
		},
		comments: false,
		mangle: {
			screw_ie8: true
		},
		screw_ie8: true,
		sourceMap: false
	}))
}

var wpCompiler = webpack(assign({}, webpackConfig, {
	cache: {},
	devtool: inProduction? null:'inline-source-map',
	debug: !inProduction
}))

function webpackTask(callback) {
		// run webpack
		wpCompiler.run(function(err, stats) {
				if(err) throw new gutil.PluginError('webpack', err)
				gutil.log('[webpack]', stats.toString({
						colors: true,
						hash: false,
						version: false,
						chunks: false,
						chunkModules: false
				}))
				browserSync.reload()
				callback()
		})
}

function styleTask() {
	return gulp.src(sources.style.map(function (f) {return 'src/style/' + f}))
		.pipe(plumber())
		.pipe(gulpif(!inProduction, sourcemaps.init()))
			.pipe(stylus(stylusOpts))
			.pipe(gulpif(inProduction, cssnano(cssnanoOpts)))
		.pipe(gulpif(!inProduction, sourcemaps.write()))
		.pipe(gulp.dest('build/style/'))
		.pipe(browserSync.stream())
}

function documentTask() {
	var simple = simpleconfig()
	var jadeData = {
		config: require('./scripts/config'),
		env: process.env.NODE_ENV || 'development',
		simpleconfig: simple
	}
	return gulp.src(sources.document.map(function (f) {return 'src/document/' + f}))
		.pipe(plumber())
		.pipe(gdata(function () { return jadeData }))
		.pipe(jade(jadeOpts))
		.pipe(gulpif(inProduction, htmlmin(htmlminOpts)))
		.pipe(gulp.dest('build/document/'))
		.pipe(browserSync.stream())
}

var lintESPipe = lazypipe()
	.pipe(eslint, eslintOpts)
	.pipe(eslint.format)
var lintCSPipe = lazypipe()
	.pipe(coffeelint)
	.pipe(coffeelint.reporter)


// Cleanup tasks
gulp.task('clean', function () {
	return del('build')
})
gulp.task('clean:script', function () {
	return del('build/script')
})
gulp.task('clean:style', function () {
	return del('build/style')
})
gulp.task('clean:document', function () {
	return del('build/document')
})

// Main tasks
gulp.task('webpack', webpackTask)
gulp.task('script', ['webpack'])
gulp.task('watch:script', function () {
	return watch(['src/script/**/*.coffee', 'src/script/**/*.js', 'src/script/template/**/*.mustache'], watchOpts, function () {
		return sequence('script')
	})
})

gulp.task('style', styleTask)
gulp.task('watch:style', function () {
	return watch('src/style/**/*.styl', watchOpts, styleTask)
})

gulp.task('document', documentTask)
gulp.task('watch:document', function () {
	return watch(['src/document/**/*.jade', 'config.toml'], watchOpts, documentTask)
})

gulp.task('lint', function () {
	return mergeStream(
		gulp.src(lintES).pipe(lintESPipe()),
		gulp.src(lintCS).pipe(lintCSPipe())
	)
})
gulp.task('watch:lint', function () {
	return mergeStream(
		watch(lintES, watchOpts, function (file) {
			gulp.src(file.path).pipe(lintESPipe())
		}),
		watch(lintCS, watchOpts, function (file) {
			gulp.src(file.path).pipe(lintCSPipe())
		})
	)
})

gulp.task('browsersync', function () {
	return browserSync.init({
		proxy: config.server.host+':'+config.server.port,
		open: false,
		online: false,
		reloadOnRestart: true
	})
})

// Default task
gulp.task('default', function (done) {
	sequence('clean', ['script', 'style', 'document', 'lint'], done)
})

// Watch task
gulp.task('watch', function (done) {
	sequence('default', ['watch:lint', 'watch:script', 'watch:style', 'watch:document', 'browsersync'], done)
})
