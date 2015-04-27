#!/usr/bin/liquidsoap

# Put the log file in some directory
set("log.file.path","./radio.log")
set("log.file", false)

# Print log messages to the console,
# can also be done by passing the -v option to liquidsoap.
set("log.stdout", true)

# Use the telnet server for requests
set("server.telnet", true)
set("server.telnet.bind_addr", "0.0.0.0")
set("server.telnet.port", 1234)
set("harbor.bind_addr", "0.0.0.0")

#set("decoder.debug",true)
#set("extproto.use_server_name",true)


%include "credentials.liq"
%include "tunein.liq"




def test_ffmpeg(file) = -1 end

ffmpeg_p = "/usr/bin/ffmpeg -loglevel panic -i - -f wav -"
add_decoder(
	name="FFMPEG",
	description="Decode files using the ffmpeg decoder binary",
	test=test_ffmpeg,
	ffmpeg_p
)

set("decoder.file_decoders",["META","WAV","AIFF","MIDI","IMAGE","FLAC","MAD","OGG","FFMPEG","GSTREAMER"])


radio_name  = "Parasprite Radio"
description = "Brony music 24/7!"
radio_url   = "http://radio.djazz.se/"
radio_genre = "Pony"

icecast_host = "icecast.djazz.se"
icecast_port = 5000
encoding = "UTF-8"
tunein_station_id = "s225092"

harbor_port = 7000

meta = ref []

# Add a skip function to a source
# when it does not have one
# by default
def add_skip_command(~command,s)
	# Register the command:
	server.register(
		usage="skip",
		description="Skip the current song in source.",
		command,
		fun(_) -> begin source.skip(s) "Done!" end
	)
end

# protocols
def eqbeats_protocol(arg,delay)
	r = get_process_lines("node scripts/eqbeats "^quote(arg))
	print(r)
	r
end
add_protocol("eqbeats", temporary=true, eqbeats_protocol)

def ponyfm_protocol(arg,delay)
	r = get_process_lines("node scripts/ponyfm "^quote(arg))
	print(r)
	r
end
add_protocol("ponyfm", temporary=true, ponyfm_protocol)

def youtube_protocol(arg,delay)
	r = get_process_lines("node scripts/youtube "^quote(arg))
	print(r)
	r
end
add_protocol("youtube", temporary=true, youtube_protocol)



def scrobble(~user,~password,m)
	audioscrobbler.nowplaying(user=user, password=password, m)
	audioscrobbler.submit(user=user, password=password, m)

	tunein.submit(partner_id=tunein_partner_id, partner_key=tunein_partner_key, station_id=tunein_station_id, m)
end


def update_nowplaying(m)
	recode = string.recode(out_enc="UTF-8")
	def f(x) =
		(recode(fst(x)),recode(snd(x)))
	end
	meta := list.map(f,m)

	data = json_of(compact=true, !meta)

	# send metadata to script
	system("node ../app/util/track-change.js "^quote(base64.encode(data)))

	# update the info on server
	ignore(http.post(
		data    = data,
		headers = [("Content-Type", "application/json; charset=utf-8")],
		timeout = 5.0,
		"http://127.0.0.1:8000/internal/meta"
	))
end

# Return the json content
# of meta
def get_meta(~protocol,~data,~headers,uri)
	http_response(
		protocol = protocol,
		code     = 200,
		headers  = [("Content-Type","application/json; charset=utf-8")],
		data     = json_of(compact=true, !meta)
	)
end
harbor.http.register(port=harbor_port, method="GET", "/getmeta", get_meta)


# playlists
songs = mksafe(audio_to_stereo(playlist(id="songs", reload_mode="watch", reload=600, prefix="/nas/audio/", "/home/djazz/.mpd/playlists/radio.m3u")))
friendship = audio_to_stereo(amplify(1.3, playlist(id="friendship", reload_mode="watch", reload=600, "friendship.m3u")))

# queue: requests; announce: plays over music
queue = audio_to_stereo(request.equeue(id="request", length=30., timeout=60.))
announce = audio_to_stereo(amplify(1.3, request.equeue(id="announce")))

source = fallback([queue, songs])

# scrobble music (last.fm & tunein) but not jingles etc..
source = on_metadata(scrobble(user=lastfm_username, password=lastfm_password), source)

add_skip_command(command="skip", source)

# TODO: replace with jingles
source = rotate(weights=[1,7], [friendship, source])

# update now playing (and generate cover art..)
source = on_metadata(update_nowplaying, source)

# submit to Liquidsoap Flow
source = register_flow(
	radio       = radio_name,
	description = description,
	website     = radio_url,
	genre       = radio_genre,

	user     = flow_username,
	password = flow_password,

	streams = [
		("mp3/320k", "http://radio.djazz.se/stream/"),
		("aac/64k", "http://radio.djazz.se/stream/?mobile")
	],
	source
)


# play announcements over the music
source = smooth_add(delay=1., p=0.1, normal=source, special=announce)

# audio tweaking
#source = normalize(gain_max=3., gain_min=-3., source)
source = smart_crossfade(start_next=2., fade_in=2., fade_out=3., width=3., source)




out = output.icecast(
	host     = icecast_host,
	port     = icecast_port,
	password = icecast_password,

	name        = radio_name,
	description = description,
	url         = radio_url,
	genre       = radio_genre,
	encoding    = encoding
)


out(
	mount = "radio",
	%mp3.cbr(
		bitrate = 320,
		stereo_mode = "joint_stereo",
		internal_quality = 0,
		id3v2 = true
	),
	source
)

out(
	mount = "radio_mobile",
	%fdkaac(
		bitrate = 64
	),
	start = false,
	source
)

out(
	mount = "radio_flac",
	%ogg(%flac(
		samplerate  = 44100,
		channels    = 2,
		compression = 7
	)),
	start = false,
	source
)
