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
import debug from 'gulp-debug'
import filter from 'gulp-filter'

// script
import standard from 'gulp-standard'
import coffeelint from 'gulp-coffeelint'
import webpack from 'webpack'
import webpackConfig from './webpack.config.js'

// style
import stylus from 'gulp-stylus'
import nib from 'nib'
import csso from 'gulp-csso'

// document
import pug from 'gulp-pug'
import htmlmin from 'gulp-htmlmin'
import watchPug from 'gulp-watch-pug'

const browserSync = BrowserSync.create()
const sequence = Sequence.use(gulp)

let sources = {
  // script: ['main.js', 'admin.coffee', 'popout.js', 'livestream.js'],
  style: ['main.styl', 'admin.styl', 'popout.styl', 'livestream.styl'],
  document: ['index.pug', 'admin.pug', 'popout.pug', 'livestream.pug']
}
let lintES = ['src/script/**/*.js', 'server/**/*.js', 'scripts/**/*.js', 'liq/scripts/**/*.js', 'gulpfile.babel.js', 'webpack.config.js', 'bin/startserver', 'knexfile.js', 'migrations/*.js']
let lintCS = ['src/script/**/*.coffee', 'server/**/*.coffee']
let fonts = ['node_modules/source-sans-pro/**/*.{eot,otf,ttf,woff}']

let inProduction = process.env.NODE_ENV === 'production' || process.argv.indexOf('-p') !== -1

let stylusOpts = {
  use: nib(),
  compress: false
}
let cssoOpts = {
  restructure: true
}

let pugOpts = {
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

let wpCompiler = webpack(assign({}, webpackConfig, {
  cache: {},
  devtool: inProduction ? 'source-map' : 'inline-source-map'
}))

function webpackTask (callback) {
  // run webpack
  wpCompiler.run(function (err, stats) {
    if (err) throw new gutil.PluginError('webpack', err)
    gutil.log('[script]', stats.toString({
      colors: true,
      hash: false,
      version: false,
      chunks: false,
      chunkModules: false
    }))
    browserSync.reload()
    if (typeof callback === 'function') callback()
  })
}

function styleTask () {
  return gulp.src(sources.style.map(function (f) { return 'src/style/' + f }))
    .pipe(plumber())
    .pipe(gulpif(!inProduction, sourcemaps.init()))
    .pipe(stylus(stylusOpts))
    .pipe(gulpif(inProduction, csso(cssoOpts)))
    .pipe(gulpif(!inProduction, sourcemaps.write()))
    .pipe(debug({title: '[style]'}))
    .pipe(gulp.dest('build/style/'))
    .pipe(browserSync.stream())
}
function fontTask () {
  return gulp.src(fonts)
    .pipe(gulp.dest('build/style/fonts/'))
}

function documentTask (p) {
  let simple = simpleconfig()
  let data = {
    config: require('./scripts/config'),
    env: process.env.NODE_ENV || 'development',
    simpleconfig: simple
  }
  return p
    .pipe(plumber())
    .pipe(gdata(function () { return data }))
    .pipe(pug(pugOpts))
    .pipe(realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(faviconDataFile)).favicon.html_code))
    .pipe(gulpif(inProduction, htmlmin(htmlminOpts)))
    .pipe(gulp.dest('build/document/'))
    .pipe(debug({title: '[document]'}))
    .pipe(browserSync.stream())
}

let lintESPipe = lazypipe()
  .pipe(standard)
  .pipe(standard.reporter, 'default', { breakOnError: false })
let lintCSPipe = lazypipe()
  .pipe(coffeelint)
  .pipe(coffeelint.reporter)

// Cleanup tasks
gulp.task('clean', () => del('build'))
gulp.task('clean:script', () => del('build/script'))
gulp.task('clean:font', () => del('build/style/fonts'))
gulp.task('clean:style', () => del('build/style'))
gulp.task('clean:document', () => del('build/document'))
gulp.task('clean:icons', () => del('build/icons'))
gulp.task('clean:quick', gulp.parallel('clean:script', 'clean:style', 'clean:document'))

// Subtasks
gulp.task('update-favicon', (done) => {
  let currentVersion
  try {
    currentVersion = JSON.parse(fs.readFileSync(faviconDataFile)).version
  } catch (e) {}

  if (currentVersion) {
    realFavicon.checkForUpdates(currentVersion, function (err) {
      if (err) {
        throw err
      }
      done()
    })
  } else {
    sequence('generate-favicon', done)
  }
})
// Generate the icons. This task takes a few seconds to complete.
// You should run it at least once to create the icons. Then,
// you should run it whenever RealFaviconGenerator updates its
// package (see the update-favicon task below).
gulp.task('generate-favicon', gulp.series('clean:icons', (done) => {
  realFavicon.generateFavicon({
    masterPicture: 'static/img/icons/parasprite-radio-nmn-hex.png',
    dest: 'build/icons/',
    iconsPath: '/',
    design: {
      ios: {
        masterPicture: 'static/img/icons/parasprite-radio-nmn-hex.png',
        pictureAspect: 'backgroundAndMargin',
        backgroundColor: '#2d2d2d',
        margin: '0%',
        appName: config.radio.title
      },
      desktopBrowser: {},
      windows: {
        pictureAspect: 'noChange',
        backgroundColor: '#da532c',
        onConflict: 'override',
        appName: config.radio.title
      },
      androidChrome: {
        masterPicture: 'static/img/icons/parasprite-radio-nmn-hex.png',
        pictureAspect: 'noChange',
        themeColor: '#2d2d2d',
        manifest: {
          name: '',
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
}))

// Main tasks
gulp.task('script', gulp.series('clean:script', webpackTask))
gulp.task('watch:script', () => {
  return watch(['src/script/**/*.coffee', 'src/script/**/*.js', 'src/script/template/**/*.mustache'], watchOpts, webpackTask)
})

gulp.task('font', gulp.series('clean:font', fontTask))
gulp.task('build:style', styleTask)
gulp.task('style', gulp.series('clean:style', 'font', 'build:style'))


gulp.task('watch:style', () => {
  return watch('src/style/**/*.styl', watchOpts, styleTask)
})

gulp.task('document', gulp.series('clean:document', 'update-favicon', () => {
  return documentTask(gulp.src(sources.document.map(function (f) { return 'src/document/' + f })))
}))
gulp.task('watch:document', () => {
  return documentTask(
    watch(['src/document/**/*.pug'], watchOpts)
      .pipe(watchPug('src/document/**/*.pug', {delay: 100}))
      .pipe(filter(sources.document.map(function (f) { return 'src/document/' + f })))
  )
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
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      target: config.server.host + ':' + config.server.port,
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
gulp.task('default', gulp.series('script', 'style', 'document', 'lint'))

// Watch task
gulp.task('watch', gulp.series('default', gulp.parallel('watch:lint', 'watch:script', 'watch:style', 'watch:document', 'browsersync')))

