/*eslint strict: [1, "global"] */
'use strict'

var path = require('path')

var config = require('./scripts/config')

// gulp and utilities
var gulp = require('gulp')
var sourcemaps = require('gulp-sourcemaps')
var gutil = require('gulp-util')
var gdata = require('gulp-data')
var del = require('del')
var gulpif = require('gulp-if')
var plumber = require('gulp-plumber')
var concat = require('gulp-concat')
var cssmin = require('gulp-minify-css')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var mergeStream = require('merge-stream')
var runSequence = require('run-sequence')
var assign = require('lodash.assign')
var browserSync = require('browser-sync').create()


// script
var uglify = require('gulp-uglify')
var eslint = require('gulp-eslint')
var coffeelint = require('gulp-coffeelint')
var browserify = require('browserify')
var coffeeify = require('coffeeify')
var babelify = require('babelify')
var hoganify = require('hoganify')

// style
var stylus = require('gulp-stylus')
var nib = require('nib')

// document
var jade = require('gulp-jade')
var htmlmin = require('gulp-htmlmin')


var sources = {
	script: ['main.js', 'admin.coffee', 'popout.js', 'livestream.js'],
	style: ['main.styl', 'admin.styl', 'popout.styl', 'livestream.styl'],
	document: ['index.jade', 'admin.jade', 'popout.jade', 'livestream.jade']
}

var libs = {
	admin: {
		script: [
			'node_modules/underscore/underscore',
			'node_modules/jquery/dist/jquery',
			'node_modules/backbone/backbone',
			'node_modules/backbone.marionette/lib/backbone.marionette',
			'node_modules/moment/moment'
		]
	}
}


var inProduction = process.env.NODE_ENV === 'production'

var browseryifyOpts = {
	extensions: ['.coffee'],

	// for speedier builds, maybe
	insertGlobals: !inProduction,
	detectGlobals: true,

	debug: !inProduction,

	paths: ['./node_modules', './src/script/']
}

var uglifyOpts = {
	compress: inProduction,
	mangle: inProduction
}

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

var scriptTasks = []
var libTasks = []

function baseNoExt(f) {
	return path.basename(f, path.extname(f))
}
function btransform(b) {
	b.transform(coffeeify)
	b.transform(hoganify)
	b.transform(babelify)
}


function configureScript(filename) {
	var f = baseNoExt(filename)

	var opts = assign({}, browseryifyOpts, {
		entries: 'src/script/' + filename
	})

	var b = browserify(opts)

	btransform(b)

	gulp.task('script:' + filename, function () {
		return b.bundle()
			.on('error', function (err) {
				gutil.log(gutil.colors.red('Browserify ' + err))
				this.emit('end')
			})
			.pipe(source(f + '.js'))
			.pipe(gulpif(inProduction, buffer()))
			//.pipe(gulpif(!inProduction, sourcemaps.init({loadMaps: true})))
				// Add transformation tasks to the pipeline here.
				.pipe(gulpif(inProduction, uglify(uglifyOpts)))
			//.pipe(gulpif(!inProduction, sourcemaps.write()))

			.pipe(gulp.dest('build/script/'))
	})

	scriptTasks.push('script:' + filename)
}

for (var s = 0; s < sources.script.length; s++) {
	configureScript(sources.script[s])
}

function configureLib(f) {
	if (libs[f].script) {
		gulp.task('lib:script:' + f, function () {
			return gulp.src(libs[f].script.map(function (i) {return i + '.js'}))
				.pipe(gulpif(!inProduction, sourcemaps.init({loadMaps: true})))
					.pipe(concat(f + '.js'))
					.pipe(gulpif(inProduction, uglify(uglifyOpts)))
				.pipe(gulpif(!inProduction, sourcemaps.write()))
				.pipe(gulp.dest('build/lib/'))
		})
		libTasks.push('lib:script:' + f)
	}
}

for (var l in libs) {
	configureLib(l)
}

// Cleanup task
gulp.task('clean', function (cb) {
	del('build', cb)
})

// Builder tasks
gulp.task('script', scriptTasks.concat('lint'), function () {
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

gulp.task('lib', libTasks)


// Watcher tasks
gulp.task('watch:script', ['script'], function () {
	return gulp.watch(['src/script/**/*.coffee', 'src/script/**/*.js', 'src/script/template/**/*.mustache'], watchOpts, ['script'])
})

gulp.task('watch:style', ['style'], function () {
	return gulp.watch('src/style/**/*.styl', watchOpts, ['style'])
})

gulp.task('watch:document', ['document'], function () {
	return gulp.watch('src/document/**/*.jade', watchOpts, ['document'])
})

gulp.task('watch:server', function () {
	return gulp.watch(['server/**/*.js', 'server/**/*.coffee'], watchOpts, ['lint'])
})

gulp.task('watch', function (done) {
	browserSync.init({
		proxy: config.server.host+':'+config.server.port
	})
	return runSequence(['clean', 'watch:server'], ['watch:script', 'watch:style', 'watch:document', 'lib'], done)
})

// Linting
gulp.task('lint', function () {
	var coffeeStream = gulp.src(['src/script/**/*.coffee', 'server/**/*.coffee'])
		.pipe(coffeelint())
		.pipe(coffeelint.reporter())

	var eslintStream = gulp.src(['src/script/**/*.js', 'server/**/*.js', 'gulpfile.js'])
		.pipe(eslint(eslintOpts))
		.pipe(eslint.format())
	return mergeStream(eslintStream, coffeeStream)
})


// Default task
gulp.task('default', function (done) {
	return runSequence('clean', ['script', 'style', 'document', 'lib'], done)
})
