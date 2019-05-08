
import imageType from 'image-type'
import imageFromFile from './imageFromFile'
import { fetcher } from '../../scripts/fetcher'

// process.env['MAGICK_DISK_LIMIT'] = '0'
// process.env['MAGICK_AREA_LIMIT'] = '200Mb'
// process.env['MAGICK_MEMORY_LIMIT'] = '200Mb'

const gm = require('gm').subClass({imageMagick: false})

let imageFormats = {
  tiny: function (image) {
    return image.gravity('Center').geometry(80, 80, '^').crop(80, 80)
  },
  small: function (image) {
    return image.gravity('Center').geometry(350, 350, '^').crop(350, 350)
  }
}

function generateArt (input, cb) {
  console.log('Generating cover art from', input)
  if (!input) {
    cb(null, null)
    return
  }

  // the input is a remote image
  if (input.indexOf('http:') === 0 || input.indexOf('https:') === 0) {
    fetcher(input, null, function (err, data) {
      if (err) {
        cb(err)
        return
      }
      handleImageData(data, cb)
    })
  // input is path to a music file
  } else {
    imageFromFile(input, function (err, _type, data) {
      if (err) {
        cb(err)
        return
      }
      if (!data) {
        cb(null, null)
        return
      }
      handleImageData(data, cb)
    })
  }
}

function handleImageData (data, cb) {
  let type = imageType(data)
  // not an image
  if (!type) {
    cb(null, null)
    return
  }

  processImage(type, data, function (err, images) {
    if (err) {
      cb(err)
      return
    }
    let o = {
      original: data,
      type: type,
      sizes: images
    }
    cb(null, o)
  })
}

function processImage (type, data, cb) {
  let c = 0
  let images = {}
  let image = gm(data, 'image.' + type.ext)
  let formats = Object.keys(imageFormats)

  function handleImage (name) {
    images[name] = null
    let batchFunc = imageFormats[name]
    batchFunc(image).setFormat('png').toBuffer(function (err, buffer) {
      if (err) {
        console.error(err)
        processNext()
        return
      }
      images[name] = buffer
      processNext()
    })
  }

  function processNext () {
    if (c === formats.length) {
      cb(null, images)
      return
    }
    let name = formats[c]
    handleImage(name)
    c++
  }

  processNext()
}

module.exports = generateArt
