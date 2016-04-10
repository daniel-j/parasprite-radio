import crypto from 'crypto'

const Song = {

	// https://github.com/BravelyBlue/PVLive/blob/master/app/models/Entity/Song.php
	getSongHash(song_info) {

		song_info = {
			text: song_info.text || '',
			title: song_info.title || '',
			artist: song_info.artist || ''
		}

		let song_text = ''

		if (song_info.text) {
			song_text = song_info.text
		} else {
			song_text = song_info.artist + ' - ' + song_info.title
		}

		let hash_base = song_text.replace(/[^A-Za-z0-9]/g, '').toLowerCase()

		// md5
		let md5sum = crypto.createHash('md5')
		md5sum.update(hash_base)
		let hash = md5sum.digest('hex')

		return hash
	}
}

export default Song
