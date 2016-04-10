'use strict'

import config from './scripts/config'
import simpleconfig from './scripts/simpleconfig'
import fs from 'fs'

// gulp and utilities
import gulp from 'gulp'
import sourcemaps from 'gulp-sourcemaps'
import gutil from 'gulp-util'
import gdata from 'gulp-data'
import del from 'del'
import gulpif from 'gulp-if'
import plumber from 'gulp-plumber'
import mergeStream from 'merge-stream'
import { assign } from 'lodash'
import BrowserSync from 'browser-sync'
import Sequence from 'run-sequence'
import watch from 'gulp-watch'
import lazypipe from 'lazypipe'
import realFavicon from 'gulp-real-favicon'

// script
import eslint from 'gulp-eslint'
import coffeelint from 'gulp-coffeelint'
import webpack from 'webpack'
import webpackConfig from './webpack.config.babel.js'

// style
import stylus from 'gulp-stylus'
import nib from 'nib'
import csso from 'gulp-csso'

// document
import jade from 'gulp-jade'
import htmlmin from 'gulp-htmlmin'

const browserSync = BrowserSync.create()
const sequence = Sequence.use(gulp)

let sources = {
	// script: ['main.js', 'admin.coffee', 'popout.js', 'livestream.js'],
	style: ['main.styl', 'admin.styl', 'popout.styl', 'livestream.styl'],
	document: ['index.jade', 'admin.jade', 'popout.jade', 'livestream.jade']
}
let lintES = ['src/script/**/*.js', 'server/**/*.js', 'scripts/**/*.js', 'liq/scripts/**/*.js', 'gulpfile.babel.js', 'webpack.config.js']
let lintCS = ['src/script/**/*.coffee', 'server/**/*.coffee']

let inProduction = process.env.NODE_ENV === 'production' || process.argv.indexOf('-p') !== -1

let eslintOpts = {
	envs: ['browser', 'node'],
	rules: {
		'strict': 0,
		'semi': [1, 'never'],
		'quotes': [1, 'single'],
		'space-infix-ops': [0, {'int32Hint': true}],
		'no-empty': 0
	}
}

let stylusOpts = {
	use: nib(),
	compress: false
}
let cssoOpts = {
	restructure: true
}


let jadeOpts = {
	pretty: !inProduction
}

let htmlminOpts = {
	collapseWhitespace: true,
	removeComments: true,
	removeAttributeQuotes: true,
	collapseBooleanAttributes: true,
	removeRedundantAttributes: true,
	removeEmptyAttributes: true,
	removeScriptTypeAttributes: true,
	removeStyleLinkTypeAttributes: true
}

let watchOpts = {
	readDelay: 500,
	verbose: true
}

// File where the favicon markups are stored
let faviconDataFile = 'build/icons/favicon-data.json'

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

let wpCompiler = webpack(assign({}, webpackConfig, {
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
			.pipe(gulpif(inProduction, csso(cssoOpts)))
		.pipe(gulpif(!inProduction, sourcemaps.write()))
		.pipe(gulp.dest('build/style/'))
		.pipe(browserSync.stream())
}

function documentTask() {
	let simple = simpleconfig()
	let jadeData = {
		config: require('./scripts/config'),
		env: process.env.NODE_ENV || 'development',
		simpleconfig: simple
	}
	return gulp.src(sources.document.map(function (f) {return 'src/document/' + f}))
		.pipe(plumber())
		.pipe(gdata(function () { return jadeData }))
		.pipe(jade(jadeOpts))
		.pipe(realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(faviconDataFile)).favicon.html_code))
		.pipe(gulpif(inProduction, htmlmin(htmlminOpts)))
		.pipe(gulp.dest('build/document/'))
		.pipe(browserSync.stream())
}

let lintESPipe = lazypipe()
	.pipe(eslint, eslintOpts)
	.pipe(eslint.format)
let lintCSPipe = lazypipe()
	.pipe(coffeelint)
	.pipe(coffeelint.reporter)


// Cleanup tasks
gulp.task('clean', () => del('build'))
gulp.task('clean:quick', ['clean:script', 'clean:style', 'clean:document'], (done) => {
	done()
})
gulp.task('clean:script', () => {
	return del('build/script')
})
gulp.task('clean:style', () => {
	return del('build/style')
})
gulp.task('clean:document', () => {
	return del('build/document')
})
gulp.task('clean:icons', () => {
	return del('build/icons')
})

// Main tasks
gulp.task('webpack', webpackTask)
gulp.task('script', ['webpack'])
gulp.task('watch:script', () => {
	return watch(['src/script/**/*.coffee', 'src/script/**/*.js', 'src/script/template/**/*.mustache'], watchOpts, function () {
		return sequence('script')
	})
})

gulp.task('style', styleTask)
gulp.task('watch:style', () => {
	return watch('src/style/**/*.styl', watchOpts, styleTask)
})

gulp.task('document', documentTask)
gulp.task('watch:document', () => {
	return watch(['src/document/**/*.jade', 'config.toml'], watchOpts, documentTask)
})

// Generate the icons. This task takes a few seconds to complete.
// You should run it at least once to create the icons. Then,
// you should run it whenever RealFaviconGenerator updates its
// package (see the update-favicon task below).
gulp.task('generate-favicon', ['clean:icons'], (done) => {
	realFavicon.generateFavicon({
		masterPicture: 'static/img/icons/parasprite-radio-logo.png',
		dest: 'build/icons/',
		iconsPath: '/',
		design: {
			ios: {
				masterPicture: 'static/img/icons/parasprite-radio-logo-hex.png',
				pictureAspect: 'backgroundAndMargin',
				backgroundColor: '#2d2d2d',
				margin: '0%',
				appName: 'Parasprite Radio'
			},
			desktopBrowser: {},
			windows: {
				pictureAspect: 'noChange',
				backgroundColor: '#da532c',
				onConflict: 'override',
				appName: 'Parasprite Radio'
			},
			androidChrome: {
				masterPicture: 'static/img/icons/parasprite-radio-logo-hex.png',
				pictureAspect: 'noChange',
				themeColor: '#2d2d2d',
				manifest: {
					name: 'Parasprite Radio',
					display: 'standalone',
					orientation: 'notSet',
					onConflict: 'override',
					declared: true
				}
			},
			safariPinnedTab: {
				pictureAspect: 'silhouette',
				themeColor: '#ffb330'
			}
		},
		settings: {
			scalingAlgorithm: 'Lanczos',
			errorOnImageTooSmall: false
		},
		versioning: true,
		markupFile: faviconDataFile
	}, done)
})
gulp.task('update-favicon', (done) => {
	let currentVersion
	try {
		currentVersion = JSON.parse(fs.readFileSync(faviconDataFile)).version
	} catch(e) {}

	if (currentVersion) {
		realFavicon.checkForUpdates(currentVersion, function (err) {
			if (err) {
				throw err
			}
			done()
		})
	} else {
		sequence('generate-favicon', 'document', done)
	}
})

gulp.task('lint', () => {
	return mergeStream(
		gulp.src(lintES).pipe(lintESPipe()),
		gulp.src(lintCS).pipe(lintCSPipe())
	)
})
gulp.task('watch:lint', () => {
	return mergeStream(
		watch(lintES, watchOpts, function (file) {
			gulp.src(file.path).pipe(lintESPipe())
		}),
		watch(lintCS, watchOpts, function (file) {
			gulp.src(file.path).pipe(lintCSPipe())
		})
	)
})

gulp.task('browsersync', () => {
	return browserSync.init({
		proxy: {
			target: config.server.host+':'+config.server.port,
			ws: true
		},
		open: false,
		online: false,
		reloadOnRestart: true,
		ghostMode: false,
		ui: false
	})
})

// Default task
gulp.task('default', (done) => {
	sequence('clean:quick', 'update-favicon', ['script', 'style', 'document', 'lint'], done)
})

// Watch task
gulp.task('watch', (done) => {
	sequence('default', ['watch:lint', 'watch:script', 'watch:style', 'watch:document', 'browsersync'], done)
})
