#!/usr/bin/liquidsoap

# Put the log file in some directory
set("log.file.path","./radio.log")

# Print log messages to the console,
# can also be done by passing the -v option to liquidsoap.
set("log.stdout", true)

# Use the telnet server for requests
set("server.telnet", true)

def lastfm.scrobble(~user,~password,m) =
	audioscrobbler.submit(user=user,password=password,m)
	audioscrobbler.nowplaying(user=user,password=password,m)
end

%include "credentials.liq"


default = mksafe(playlist(reload_mode="watch", reload=600, prefix="/mnt/music/", "/home/djazz/.mpd/playlists/radio.m3u"))

source = fallback([request.queue(id="request"), default])

source = normalize(gain_max=3., gain_min=-3., source)

source = on_metadata(lastfm.scrobble(user=lastfm_username,password=lastfm_password), source)

source = smart_crossfade(start_next=2., fade_in=2., fade_out=3., width=3., source)


output.icecast(
	%mp3.cbr(bitrate=160),

	host = "vm.djazz.se",
	password = icecast_password,
	mount = "radio",

	name = "Parasprite Radio",
	description = "Brony music 24/7!",
	url = "http://radio.djazz.se",
	genre = "Pony",
	encoding = "UTF-8",

	source
)
