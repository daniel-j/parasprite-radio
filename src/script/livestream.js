import xhr from 'utils/xhr'

//let viewercount = document.getElementById('viewercount')
let liveplayer = document.getElementById('liveplayer')

let player = null

function startPlayer() {

	let id = 'jwplayer'
	player = jwplayer(id)
	window.jw = player
	player.setup({
		playlist: [
			{ file: 'http://vm.djazz.se/dash/pr/stream.mpd', image: 'http://vm.djazz.se/rec/thumb/stream.png?t='+Date.now() },
			{ file: 'http://vm.djazz.se/hls/pr/stream.m3u8', image: 'http://vm.djazz.se/rec/thumb/stream.png?t='+Date.now() },
			{ file: 'rtmp://vm.djazz.se/live/stream', image: 'http://vm.djazz.se/rec/thumb/stream.png?t='+Date.now() }
		],
		dash: true,
		androidhls: true,
		rtmp: {
			bufferlength: 5
		},
		height: '100%',
		width: '100%'
	})
	player.on('all', function () {
		document.getElementById(id).classList.remove('jw-flag-aspect-mode')
	})
}


function updateStatus() {
	setTimeout(updateStatus, 5*1000)
	//console.log("fetching now playing")
	xhr('/api/status', function (res) {
		let data
		try {
			data = JSON.parse(res)
		} catch (e) {
			console.log(res)
			data = {}
			return
		}

		if (!data || !data.livestream) {
			return
		}

		if (data.livestream.online) {
			viewercount.textContent = data.livestream.viewers
			liveplayer.classList.remove('offline')
		} else {
			viewercount.textContent = '-'
			liveplayer.classList.add('offline')
			player.stop()
		}


	})
}

startPlayer()
updateStatus()

module.exports = player
