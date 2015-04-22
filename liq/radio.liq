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

%include "credentials.liq"
%include "tunein.liq"


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

# Mixes two streams, with faded transitions between the state when only the
# normal stream is available and when the special stream gets added on top of
# it.
# @category Source / Track Processing
# @param ~delay   Delay before starting the special source.
# @param ~p       Portion of amplitude of the normal source in the mix.
# @param ~normal  The normal source, which could be called the carrier too.
# @param ~special The special source.
def smooth_add(~delay=0.5,~p=0.2,~normal,~special)
	d = delay
	fade.final = fade.final(duration=d*2.)
	fade.initial = fade.initial(duration=d*2.)
	q = 1. - p
	c = amplify
	fallback(track_sensitive=false,
	[special,normal],
	transitions=[
		fun(normal,special)->
			add(normalize=false,
					[c(p,normal),
					 c(q,fade.final(type="sin",normal)),
					 sequence([blank(duration=d),c(q,special)])]),
		fun(special,normal)->
			add(normalize=false,
					[c(p,normal),
					 c(q,fade.initial(type="sin",normal))])
	])
end


def scrobble(~user,~password,m)
	audioscrobbler.nowplaying(user=user, password=password, m)
	audioscrobbler.submit(user=user, password=password, m)

	tunein.submit(partner_id=tunein_partner_id, partner_key=tunein_partner_key, station_id=tunein_station_id, m)
end


def update_nowplaying(m)
	# is this needed? oh well..
	recode = string.recode(out_enc="UTF-8")
	def f(x) =
		(recode(fst(x)),recode(snd(x)))
	end
	meta := list.map(f,m)

	data = json_of(compact=true, m)

	# send metadata to script
	system("node ../app/util/track-change.js "^quote(base64.encode(data)))

	# update the info on server
	ignore(http.post(
		data    = data,
		headers = [("Content-Type", "application/json; charset=utf-8")],
		timeout = 5.0,
		"http://127.0.0.1:8000/liquidsoap-meta"
	))
end

# Return the json content
# of meta
def get_meta(~protocol,~data,~headers,uri) =
	m = !meta
	http_response(
		protocol = protocol,
		code     = 200,
		headers  = [("Content-Type","application/json; charset=utf-8")],
		data     = json_of(compact=true, m)
	)
end

# playlists
songs = mksafe(audio_to_stereo(playlist(reload_mode="watch", reload=600, prefix="/mnt/", "/home/djazz/.mpd/playlists/radio.m3u")))
friendship = audio_to_stereo(playlist(reload_mode="watch", reload=600, "friendship.m3u"))

# queue: requests; announce: plays over music
queue = audio_to_stereo(request.queue(id="request"))
announce = audio_to_stereo(request.queue(id="announce"))

source = fallback([queue, songs])

# scrobble music (last.fm & tunein) but not jingles etc..
source = on_metadata(scrobble(user=lastfm_username, password=lastfm_password), source)

# TODO: replace with jingles
source = rotate(weights=[1,10], [friendship, source])

# update now playing (and generate cover art..)
source = on_metadata(update_nowplaying, source)

# http endpoint to get metadata
harbor.http.register(port=harbor_port, method="GET", "/getmeta", get_meta)

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
source = smooth_add(delay=0.8, p=0.15, normal=source, special=announce)

# audio tweaking
#source = normalize(gain_max=3., gain_min=-3., source)
source = smart_crossfade(start_next=2., fade_in=2., fade_out=3., width=3., source)






output.icecast(
	%mp3.abr(
		bitrate = 320,
		stereo_mode = "joint_stereo",
		internal_quality = 3,
		id3v2 = true
	),

	host     = icecast_host,
	port     = icecast_port,

	mount    = "radio",
	password = icecast_password,

	name        = radio_name,
	description = description,
	url         = radio_url,
	genre       = radio_genre,
	encoding    = encoding,

	source
)

output.icecast(
	%fdkaac(bitrate=64),

	host     = icecast_host,
	port     = icecast_port,

	mount    = "radio_mobile",
	password = icecast_password,

	name        = radio_name,
	description = description,
	url         = radio_url,
	genre       = radio_genre,
	encoding    = encoding,

	source
)
