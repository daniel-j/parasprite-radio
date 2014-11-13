'use strict'

# Configuration

libs = [
	'bower/jquery/jquery.min'
	'bower/underscore/underscore'
	'bower/backbone/backbone'
	'bower/marionette/backbone.marionette'
	'bower/moment/moment.min'
	'dust-runtime'
]


structure = [
	'custom/**/*'
	'behaviors/**/*'
	'app'
	'base/**/*'
	'utils'
	'entities/**/*'
	'views'
	'components/**/*'
	'launch'
]


applications =
	main: structure
	admin: structure


jadedata =
	env: process.env.NODE_ENV || 'development'


builddir = 'build'
distdir = 'dist' # put the compiled code here
libdir = 'lib'
commondir = 'src/common'
tpldir = commondir+'/tpl'
jadedir = 'src/jade'

#releasesprites = distdir+'/img/sprites.png'



# create an object with a variable key
key = (k, p) ->
	o = {}
	o[k] = p
	o

module.exports = (grunt) ->
	require('time-grunt') grunt
	require('load-grunt-tasks') grunt

	inProduction = process.env.NODE_ENV == 'production'

	mapfiles = {}
	uglifyfiles = {}
	coffeefiles = {}
	coffeefilesdebug = []
	stylefiles = {}
	watchcoffeefiles = []
	lintfiles = []

	lintfiles.push 'src/coffee/**/*.coffee'

	for own name, files of applications

		uglifyfiles[distdir+'/js/'+name+'.min.js'] = [builddir+'/'+name+'.core.js']

		coffeefilesdebug.push
			expand: true
			cwd: 'src/'+name+'/coffee'
			src: ['**/*.coffee']
			dest: builddir+'/js/'+name
			ext: '.js'

		lintfiles.push 'src/'+name+'/coffee/**/*.coffee'
		stylefiles[distdir+'/style/'+name+'.css'] = 'src/'+name+'/style/style.less'
		coffeefiles[builddir+'/'+name+'.core.js'] = []
		#coffeefilesdebug[distdir+'/js/'+name+'.min.js'] = []
		mapfiles[distdir+'/js/'+name+'.min.js'] = []

		files.forEach (f, i) ->
			coffeefiles[builddir+'/'+name+'.core.js'].push 'src/'+name+'/coffee/'+f+'.coffee'
			#coffeefilesdebug[distdir+'/js/'+name+'.min.js'][i] = 'src/'+name+'/coffee/'+f+'.coffee'

			mapfiles[distdir+'/js/'+name+'.min.js'].push builddir+'/js/'+name+'/'+f+'.js.map'


	libs.forEach (f, i) ->
		libs[i] = libdir+'/'+f+'.js'



	gruntconfig =

		pkg: grunt.file.readJSON 'package.json'


		uglify:

			release:
				options:
					mangle: false
					sourceMap: false
					banner: '// <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n'
				files: uglifyfiles

			libs:
				options:
					mangle: false
					sourceMap: false
				files: key distdir+'/js/libs.min.js', libs

			common:
				options:
					mangle: false
					sourceMap: false
				files: key(distdir+'/js/common.min.js', [builddir+'/dust.js', builddir+'/common.js'])


		coffee:
			# TODO: Add debugging mode
			debug:
				options:
					sourceMap: true
				files: coffeefilesdebug

			release:
				files: coffeefiles

			common:
				files: key(builddir+'/common.js', ['src/common/coffee/**/*.coffee'])


		mapcat:
			default:
				files: mapfiles


		coffeelint:
			app:
				files:
					src: lintfiles
				options:
					force: true
					no_tabs:
						level: 'ignore'
					indentation:
						level: 'ignore'
					max_line_length:
						level: 'ignore'

		# sprite:
		# 	default:
		# 		src: spritedir+'/**/*.png'
		# 		destImg: releasesprites
		# 		destCSS: 'src/less/sprites.less'
		# 		algorithm: 'binary-tree'
		# 		cssFormat: 'less'
		# 		imgPath: '../img/sprites.png'
		# 		cssTemplate: 'src/less/sprites.less.mustache'


		less:
			development:
				files: stylefiles

			production:
				options:
					#paths: [lessdir]
					cleancss: true
					compress: true

				files: stylefiles


		dust:
			default:
				options:
					wrapper: false
					basePath: tpldir
					runtime: false
				files: key(builddir+'/dust.js', [tpldir+'/**/*.dust'])


		jade:
			default:
				options:
					pretty: true
					data: jadedata

				files: [
					expand: true
					cwd: jadedir
					src: ['**/*.jade']
					dest: builddir+'/html'
					ext: '.html'
					extDot: 'last'
				]


		htmlmin:
			options:
				collapseBooleanAttributes: inProduction
				collapseWhitespace: inProduction
				removeComments: inProduction
				removeAttributeQuotes: inProduction
				removeCommentsFromCDATA: inProduction
				removeEmptyAttributes: inProduction
				removeOptionalTags: false
				removeRedundantAttributes: inProduction
				useShortDoctype: true

			jade:
				files: [
					expand: true
					cwd: builddir+'/html'
					src: ['**/*.html']
					dest: distdir
				]

		copy:
			jade:
				files: [
					expand: true
					cwd: builddir+'/html'
					src: ['**/*.html']
					dest: distdir
				]

		clean:
			build: [builddir]

			js: [builddir+'/js']
			jade: [builddir+'/jade']
			dist: [distdir]

		bower:
			default:
				options:
					targetDir: libdir+'/bower'
					cleanTargetDir: true
					bowerOptions:
						production: true

		watch:

			#	gruntfile:
			#		files: ['Gruntfile.coffee']


			jade:
				files: [jadedir+'/**/*.jade']
				tasks: [
					'build:jade'
				]
				options:
					debounceDelay: 250
					spawn: false

			less:
			#	files: ['src/**/*.less', spritedir+'/**/*.png']
				files: ['src/*/style/**/*.less', 'common/style/**/*.less']
				tasks: [
					'build:less'
				]
				options:
					debounceDelay: 250
					spawn: false
					livereload: true

			# env specific watchers below

		concurrent:
			options:
				logConcurrentOutput: true

			production: [
				'build:release'
				'build:jade'
				'build:less'
			]
			development: [
				'build:debug'
				'build:jade'
				'build:less'
			]

	if inProduction
		gruntconfig.watch.core =
			files: lintfiles
			tasks: [
				'coffee:release'
				'uglify:release'
				'coffeelint'
			]
			options:
				debounceDelay: 250
				spawn: false

		gruntconfig.watch.tpl =
			files: [tpldir+'/**/*.dust']
			tasks: [
				'dust'
				'coffee:common'
				'uglify:common'
			]
			options:
				debounceDelay: 250
				spawn: false


	else
		gruntconfig.watch.core =
			files: lintfiles
			tasks: [
				'clean:js'
				'debug'
				'coffeelint'
			]
			options:
				debounceDelay: 250
				spawn: false

		gruntconfig.watch.tpl =
			files: [tpldir+'/**/*.dust']
			tasks: [
				'dust'
				'coffee:common'
				'uglify:common'
			]
			options:
				debounceDelay: 250
				spawn: false

		gruntconfig.watch.commoncoffe =
			files: [commondir+'/coffee/**/*.coffee']
			tasks: [
				'coffee:common'
				'uglify:common'
			]
			options:
				debounceDelay: 250
				spawn: false

	grunt.initConfig gruntconfig

	if inProduction
		grunt.registerTask 'build:default', [
			'build:production'
		]

		grunt.registerTask 'build:jade', [
			'jade:default'
			'htmlmin:jade'
		]

		grunt.registerTask 'build:less', [
		#	'sprite'
			'less:production'
		]

	else
		grunt.registerTask 'build:default', [
			'build:development'
		]

		grunt.registerTask 'build:jade', [
			'jade:default'
			'copy:jade'
		]

		grunt.registerTask 'build:less', [
		#	'sprite'
			'less:development'
		]

	grunt.registerTask 'default', ['build:default']
	grunt.registerTask 'build', ['default']

	grunt.registerTask 'edit', [
		'build:default'
		'watch'
	]

	grunt.registerTask 'libs', [
		'uglify:libs'
	]

	grunt.registerTask 'debug', [
		'coffee:debug'
		'mapcat'
	]

	grunt.registerTask 'build:debug', [
		'libs'
		'dust'
		'coffee:common'
		'uglify:common'
		'debug'
	]

	grunt.registerTask 'build:release', [
		'libs'
		'dust'
		'coffee:common'
		'uglify:common'
		'coffee:release'
		'uglify:release'
	]

	grunt.registerTask 'build:production', [
		'clean'
		'concurrent:production'
		'coffeelint'
	]

	grunt.registerTask 'build:development', [
		'clean'
		'concurrent:development'
		'coffeelint'
	]
