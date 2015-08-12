
export default function xhr(url, cb) {
	var x = new XMLHttpRequest()
	x.open('get', url, true)
	x.onload = function () {
		cb(x.responseText)
	}
	x.onerror = function () {
		cb(null)
	}
	x.send()
}

