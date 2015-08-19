crypto = require 'crypto'

Song =

	# https://github.com/BravelyBlue/PVLive/blob/master/app/models/Entity/Song.php
	getSongHash: (song_info) ->

		song_info =
			text: song_info.text or ''
			title: song_info.title or ''
			artist: song_info.artist or ''

		song_text = ''

		if song_info.text
			song_text = song_info.text
		else
			song_text = song_info.artist + ' - ' + song_info.title

		hash_base = song_text.replace(/[^A-Za-z0-9]/g, '').toLowerCase()

		# md5
		md5sum = crypto.createHash 'md5'
		md5sum.update hash_base
		hash = md5sum.digest 'hex'

		hash

module.exports = Song
