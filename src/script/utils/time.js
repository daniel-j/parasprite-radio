'use strict'

import zf from './zf'

export function formattime (time) {
  time = time | 0
  if (time < 3600) {
    return (time / 60 | 0) + ':' + zf(time % 60)
  } else {
    return (time / 3600 | 0) + ':' + zf((time % 3600) / 60 | 0) + ':' + zf((time % 3600) % 60)
  }
}

export function timeago (timems) {
  let time = timems | 0
  let val, name
  if (time < 60) {
    val = time
    name = 'second'
  } else if (time < 3600) {
    val = Math.round(time / 60)
    name = 'minute'
  } else if (time < 86400) {
    val = Math.round(time / 3600)
    name = 'hour'
  } else {
    val = Math.round(time / 86400)
    name = 'day'
  }
  return val + ' ' + name + (val === 1 ? '' : 's') + ' ago'
}
