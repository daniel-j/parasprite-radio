import crypto from 'crypto'

const Song = {
  // https://github.com/BravelyBlue/PVLive/blob/master/app/models/Entity/Song.php
  getSongHash (songInfo) {
    songInfo = {
      text: songInfo.text || '',
      title: songInfo.title || '',
      artist: songInfo.artist || ''
    }

    let songText = ''

    if (songInfo.text) {
      songText = songInfo.text
    } else {
      songText = songInfo.artist + ' - ' + songInfo.title
    }

    let hashBase = songText.replace(/[^A-Za-z0-9]/g, '').toLowerCase()

    // md5
    let md5sum = crypto.createHash('md5')
    md5sum.update(hashBase)
    let hash = md5sum.digest('hex')

    return hash
  }
}

export default Song
