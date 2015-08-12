window.notifications = false

function checkNotify() {
	if ('Notification' in window) {
		if (Notification.permission !== 'denied') {
			Notification.requestPermission(function (permission) {
				if(!('permission' in Notification)) {
					Notification.permission = permission
					if (permission === 'granted') {
						window.notifications = true
					}
				} else {
					permission = Notification.permission
					if (permission === 'granted') {
						window.notifications = true
					}
					else {
						window.notifications = false
					}
				}
			})
		}
	}
}

function notify(title, body, image, time) {
	if (window.notifications) {
		if ('Notification' in window) {
			if (Notification.permission === 'granted') {
				let notification = new Notification(title, {
					icon: image || '/img/parasprite-radio.png',
					body: body
				})
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
