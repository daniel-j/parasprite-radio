window.notifications = false

function checkNotify (cb) {
  if ('Notification' in window) {
    if (Notification.permission !== 'denied') {
      Notification.requestPermission(function (permission) {
        if (!('permission' in Notification)) {
          Notification.permission = permission
          if (permission === 'granted') {
            window.notifications = true
          }
        } else {
          permission = Notification.permission
          if (permission === 'granted') {
            window.notifications = true
            cb && cb(true)
          } else {
            window.notifications = false
            cb && cb(false)
          }
        }
      })
    }
  }
}

function notify (title, body, image, time) {
  if (window.notifications) {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        let opts = {
          icon: image || '/img/parasprite-radio.png',
          body: body
        }
        let notification = null
        try {
          notification = new Notification(title, opts)
        } catch (err) {
          if (err.name === 'TypeError') {
            // TODO: Add support for Service Worker API
            return
          }
        }
        if (time !== 0) {
          notification.onshow = function () {
            setTimeout(notification.close.bind(notification), time * 1000 || 5000)
          }
        }
        return notification
      }
    }
  }
}

export {checkNotify as check}
export {notify as show}
