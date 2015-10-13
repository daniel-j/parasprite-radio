'use strict'

var config = require('./scripts/config')

// gulp and utilities
var gulp = require('gulp')
var sourcemaps = require('gulp-sourcemaps')
var gutil = require('gulp-util')
var gdata = require('gulp-data')
var del = require('del')
var gulpif = require('gulp-if')
var plumber = require('gulp-plumber')
var cssmin = require('gulp-minify-css')
var mergeStream = require('merge-stream')
var assign = require('lodash').assign
var browserSync = require('browser-sync').create()
var sequence = require('run-sequence').use(gulp)

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
var cssminOpts = {

}

var jadeOpts = {
	pretty: !inProduction
}
var jadeData = {
	config: config,
	env: process.env.NODE_ENV || 'development'
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
	debounceDelay: 500
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

// Builder tasks
gulp.task('script', ['webpack', 'lint'], function () {
	return browserSync.reload()
})

gulp.task('style', function () {
	return gulp.src(sources.style.map(function (f) {return 'src/style/' + f}))
		.pipe(plumber())
		.pipe(gulpif(!inProduction, sourcemaps.init()))
			.pipe(stylus(stylusOpts))
			.pipe(gulpif(inProduction, cssmin(cssminOpts)))
		.pipe(gulpif(!inProduction, sourcemaps.write()))
		.pipe(gulp.dest('build/style/'))
		.pipe(browserSync.stream())
})

gulp.task('document', function () {
	return gulp.src(sources.document.map(function (f) {return 'src/document/' + f}))
		.pipe(plumber())
		.pipe(gdata(function () { return jadeData }))
		.pipe(jade(jadeOpts))
		.pipe(gulpif(inProduction, htmlmin(htmlminOpts)))
		.pipe(gulp.dest('build/document/'))
		.pipe(browserSync.stream())
})


gulp.task('webpack', function (callback) {
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
        callback()
    })
})
//gulp.task('watch:webpack', ['webpack'], function () {
//	return gulp.watch(['src/script/**/*.coffee', 'src/script/**/*.js', 'src/script/template/**/*.mustache'], watchOpts, ['webpack'])
//})


// Watcher tasks
gulp.task('watch:script', function () {
	return gulp.watch(['src/script/**/*.coffee', 'src/script/**/*.js', 'src/script/template/**/*.mustache'], watchOpts, ['script'])
})

gulp.task('watch:style', function () {
	return gulp.watch('src/style/**/*.styl', watchOpts, ['style'])
})

gulp.task('watch:document', function () {
	return gulp.watch('src/document/**/*.jade', watchOpts, ['document'])
})

gulp.task('watch:server', function () {
	return gulp.watch(['server/**/*.js', 'server/**/*.coffee'], watchOpts, ['lint'])
})

// Linting
gulp.task('lint', function () {
	var coffeeStream = gulp.src(['src/script/**/*.coffee', 'server/**/*.coffee'])
		.pipe(coffeelint())
		.pipe(coffeelint.reporter())

	var eslintStream = gulp.src(['src/script/**/*.js', 'server/**/*.js', 'gulpfile.js', 'webpack.config.js'])
		.pipe(eslint(eslintOpts))
		.pipe(eslint.format())
	return mergeStream(eslintStream, coffeeStream)
})

gulp.task('browsersync', function () {
	browserSync.init({
		proxy: config.server.host+':'+config.server.port
	})
})

// Default task
gulp.task('default', function (done) {
	sequence('clean', ['script', 'style', 'document'], done)
})

gulp.task('watch', function (done) {
	sequence(['default', 'watch:server', 'watch:script', 'watch:style', 'watch:document'], 'browsersync', done)
})
