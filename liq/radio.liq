#!/usr/bin/liquidsoap

# Put the log file in some directory
set("log.file.path","./radio.log")
set("log.file", false)
set("log.stdout", true)
#set("log.level", 4)

%include "config.liq"

# to run in dev mode: liquidsoap radio.liq -- dev
inDev = argv(1) == "dev"
inProd = not(inDev)

# Use the telnet server for requests
set("server.telnet", true)
set("server.telnet.bind_addr", "0.0.0.0")
set("server.telnet.port", confint("liquidsoap.port_telnet", 7004))

port_input = confint("liquidsoap.port_input", 7005)

set("harbor.bind_addr", "0.0.0.0")
set("harbor.verbose", false)
set("harbor.reverse_dns", true)

set("mpd.host", "127.0.0.1")
set("mpd.port", 6600)
set("mpd.path", confstr("general.media_dir"))
set("mpd.randomize", false)

set("alsa.alsa_buffer", 1)
set("alsa.buffer_length", 20)
set("alsa.periods", 0)

set("frame.audio.samplerate",44100)
set("audio.converter.samplerate.libsamplerate.quality","best")

#set("decoder.debug",true)
#set("extproto.use_server_name",true)

serverport = (if getenv("SERVER_PORT") == "" then "#{confint('server.port', 8002)}" else getenv("SERVER_PORT") end)

%include "utils.liq"
%include "tunein.liq"
%include "protocols.liq"
%include "decoders.liq"

meta = ref []
live_meta = ref []
live_token = ref ""
live_stop_record = ref (fun () -> ())
live_src = ref blank()

archiveEncoder = %mp3.vbr(quality=0, stereo_mode="joint_stereo", internal_quality=0, id3v2=true)



# temporary solution https://github.com/savonet/liquidsoap/issues/217
def track_end_cleanup(time, m)
	if m["temporary"] == "true" and m["filename"] != "" then
		#print("time left: #{time}")
		print("rm "^quote(m["filename"]))
		system("rm "^quote(m["filename"]))
		#print(m)
	end
end


def scrobble_nowplaying(m)
	audioscrobbler.nowplaying(user=confstr("lastfm.username"), password=confstr("lastfm.password"), m)
	tunein.nowplaying(partner_id=confstr("tunein.partnerId"), partner_key=confstr("tunein.partnerKey"), station_id=confstr("tunein.stationId"), m)
end

def scrobble_submit(t, m)
	audioscrobbler.submit(user=confstr("lastfm.username"), password=confstr("lastfm.password"), m)
end

# send metadata to server and print the response
def send_metadata(m)
	print("META: "^snd(http.post(
		data    = json_of(compact=true, m),
		headers = [("Content-Type", "application/json; charset=utf-8")],
		timeout = 10.0,
		"http://#{confstr('server.host', 'localhost')}:#{serverport}/internal/meta"
	)))
end

def update_nowplaying(m)
	recode = string.recode(out_enc="UTF-8")
	def f(x)
		(recode(fst(x)),recode(snd(x)))
	end

	m = list.map(f,m)
	m = list.remove_assoc("cover", m)
	m = list.remove_assoc("picture", m)
	meta := m

	send_metadata(m)
end

server.register(
	usage="smartqueue <url/file>",
	description="Smart queue command.",
	"smartqueue",
	fun(arg) -> begin
		print("Queueing #{arg}")
		ignore(server.execute("request.push smart:"^arg))
		"OK!"
	end
)
server.register(
	usage="sendmetadata",
	description="Triggers a HTTP request to the server with metadata.",
	"sendmetadata",
	fun(arg) -> begin
		send_metadata(!meta)
		"OK!"
	end
)

def auth_live(user,password)
	print("LIVE: A user is connecting...")
	current_token = !live_token

	if current_token == "" or current_token == password then

		data = snd(http.post(
			data    = json_of(compact=true, [("username", user), ("password", password)]),
			headers = [("Content-Type", "application/json; charset=utf-8")],
			timeout = 5.0,
			"http://#{confstr('server.host', 'localhost')}:#{serverport}/internal/authlive"
		))

		ret = of_json(default=[("error", "JSON error")], data)

		if ret["error"] == "" then
			print("LIVE: User "^ret["live_username"]^" authenticated successfully")
			live_meta := ret
			live_token := password
			true
		else
			print("LIVE: Authentication error: "^ret["error"])
			false
		end

	else
		print("LIVE: Another user is already connected!")
		false
	end
end


def user_connected(headers)
	print("live headers")
	print(headers)
	m = list.set_list([
		("live_ice_name", headers["ice-name"]),
		("live_ice_description", headers["ice-description"]),
		("live_ice_genre", headers["ice-genre"]),
		("live_ice_url", headers["ice-url"])
	], !live_meta)

	# cleanup
	def filter(x)
		value = snd(x)
		if value == "(none)" or value == " " then
			false
		else
			true
		end
	end

	m = list.filter(filter, m)

	live_meta := m
end

def user_disconnected()
	m = !live_meta
	print("LIVE: User "^m["live_username"]^" disconnected")
end


def live_start_recording(mm)
	ls = !live_src
	token = !live_token

	if token != "" then

		filename = "../archive/"^mm["live_username"]^"-"^mm["live_name"]^"/%Y-%m-%d/%Y-%m-%d-%H_%M_%S "^mm["live_name"]^".mp3"

		# Record the live stream
		outfile = output.file(
			archiveEncoder,
			on_start={print("LIVE: Starting recording...")}, # would be nice to get the actual filename here aswell..
			on_close=fun(f) -> print("LIVE: Recording finished! #{f}"),
			fallible=true,
			filename,
			ls
		)

		live_stop_record := fun() -> source.shutdown(outfile)
	end
end

def live_end_recording(t, m)
	print("LIVE: Stream ended!")
	print(m)
	f = !live_stop_record
	f()

	live_token := "" # release lock
end


# playlists
default = audio_to_stereo(mksafe(playlist(id="default", reload_mode="watch", reload=600, timeout=600., prefix=confstr("general.media_dir")^"/", "/home/djazz/.mpd/playlists/radio.m3u")))
extra = audio_to_stereo(playlist(id="nmn", reload_mode="watch", reload=600, timeout=600., prefix=confstr("general.media_dir")^"/", "/home/djazz/.mpd/playlists/nmn.m3u"))
friendship = audio_to_stereo(amplify(1.1, playlist(id="friendship", reload_mode="watch", reload=600, "friendship.m3u")))

# queue: requests; announce: plays over music
queue = audio_to_stereo(request.equeue(id="request", conservative=true, length=300., timeout=3600.))
announce = audio_to_stereo(request.equeue(id="announce", conservative=true, length=300., timeout=3600.))

add_skip_command(command="request.skip", queue)

songs = random(weights=[1,1], [extra,default])

source = fallback([queue, songs])

# scrobble music (last.fm & tunein) but not jingles etc..
source = store_metadata(id="history", size=20, source)
# if-statements are scoped! workaround below
# this makes it only scrobble tracks in production
source = if inProd then
	source = on_track(scrobble_nowplaying, source)
	source = on_end(delay=0., scrobble_submit, source)
	source
else source end

# TODO: replace with jingles
source = rotate(weights=[1,7], [friendship,source])

add_skip_command(command="skip", source)

# cleanup temp files
source = on_end(delay=0., track_end_cleanup, source)
announce = on_end(delay=0., track_end_cleanup, announce)

# crossfade songs!
source = smart_crossfade(conservative=true, start_next=3., fade_in=2., fade_out=3., width=5., source)



def to_live(old,new)
	old = fade.final(duration=2., old)
	new = fade.initial(duration=2., new)
	sequence(merge=true, [old,new])
end

def to_songs(old,new)
	old = fade.final(duration=3., old)
	new = fade.initial(duration=3., new)
	#source.skip(new)
	sequence([old,new])
end


# Live input
live = audio_to_stereo(input.harbor(
	"/", # supporting shoutcast and icecast (empty mount) sources
	id = "live",
	buffer = 5.,
	port = port_input,
	auth = auth_live,
	icy = true, # enables Shoutcast support (untested, uses port_input+1)
	icy_metadata_charset = 'UTF-8',
	metadata_charset = 'UTF-8',
	on_connect = user_connected,
	on_disconnect = user_disconnected
))

live = map_metadata(fun(m) -> !live_meta, live)

#live = map_metadata(fun(m) -> begin
	#l = ref []

	#if m["title"] != "" then
	#	l := list.add(("title", m["live_name"]^" - "^m["title"]), !l)
	#else
	#	l := list.add(("title", m["live_name"]), !l)
	#end

	#list.append([
	#	("artist", m["live_displayname"]),
	#	("album", m["live_description"])
	#], !l)
#end, live)

live_src := live

live = on_track(live_start_recording, live)
live = on_end(delay=0., live_end_recording, live)

source = fallback(track_sensitive=false, transitions=[to_live, to_songs], [live, source])

source = map_metadata(fun (m) -> begin
	if m['filename'] != '' and m['decoder'] == 'MAD' then
		[('bitrate', get_process_output('mp3info -r m -p "%r" '^quote(m['filename'])))]
	else
		[]
	end
end, source)

# update now playing (and generate cover art..)
source = on_metadata(update_nowplaying, source)

# play announcements over the music
source = smooth_add(delay=0.3, p=0.3, normal=source, special=amplify(2., nrj(announce)))
#source = add(normalize=false, [source, amplify(1.8, nrj(announce))])

# audio tweaking
#source = normalize(gain_max=3., gain_min=-3., source)




%include "outputs.liq"
#output.dummy(source)
