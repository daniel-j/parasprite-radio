
import imageType from 'image-type'
import imageFromFile from './imageFromFile'
import { fetcher } from '../../scripts/fetcher'

const gm = require('gm').subClass({imageMagick: true})

let imageFormats = {
  tiny: function (image) {
    return image.gravity('Center').geometry(80, 80, '^').crop(80, 80)
  },
  small: function (image) {
    return image.gravity('Center').geometry(350, 350, '^').crop(350, 350)
  }
}

function generateArt (input, cb) {
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
  let totalCount = 0
  let c = 0
  let images = {}
  let image = gm(data, 'iamge.' + type.ext)

  function handleImage (name) {
    let batchFunc = imageFormats[name]
    batchFunc(image).toBuffer('png', function (err, buffer) {
      if (err) {
        console.error(err)
        done()
        return
      }
      images[name] = buffer
      done()
    })
  }

  function done () {
    c++
    if (c === totalCount) {
      cb(null, images)
    }
  }

  for (let name in imageFormats) {
    images[name] = null
    totalCount++
    handleImage(name)
  }
}

module.exports = generateArt
