#!/usr/bin/env node
'use strict';

var libs = {
	admin: [
		'jquery/'
	]
}

var apps = {
	admin: [
		'custom/marionette.application',
		'custom/marionette.render.dust',

		'base/controller',

		'behaviors/_',
		'behaviors/trackdrag',
		'behaviors/trackmenu',
		'behaviors/trackselect',

		'apps/admin',

		'utils',

		'entities/admin.entities',
		'entities/nav',

		'views/admin.tracks',

		'components/browse/*',
		'components/nav/*',
		'components/playlist/*',
		'components/queue/*',
		'components/search/*',

		'launch'

	]
}

