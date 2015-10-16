#!/usr/bin/liquidsoap

# Put the log file in some directory
set("log.file.path","./radio.log")
set("log.file", false)
set("log.stdout", true)
#set("log.level", 4)

%include "config.liq"

# Use the telnet server for requests
set("server.telnet", true)
set("server.telnet.bind_addr", "0.0.0.0")
set("server.telnet.port", confint("liquidsoap.port_telnet", 1234))


port_harbor = confint("liquidsoap.port_harbor", 7000)
port_input = confint("liquidsoap.port_input", 8001)

set("harbor.bind_addr", "0.0.0.0")

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

def file_metadata(file)
	of_json(default=[], get_process_output("node scripts/metadata "^quote(file)))
end

xmp_ext = ['mod','s3m','xm','it','j2b']
add_oblivious_decoder(
	name="XMP",
	description="Decode music modules using the xmp binary",
	test=fun(file) -> begin
		f = string.case(lower=true, file)
		ret = string.extract(pattern='\.(.+)$', f)
		if list.length(ret) != 0 then
			ext = ret["1"]
			if list.mem(ext, xmp_ext) then
				-1
			else
				0
			end
		else
			0
		end

	end,
	fun(f) -> "xmp --nocmd -o - -d wav "^quote(f)^" 2>/dev/null"
)
add_metadata_resolver("XMP", file_metadata)


add_decoder(
	name="FFMPEG",
	description="Decode audio files using the ffmpeg/avconv decoder binary",
	test=fun(file) -> -1,
	"$(which ffmpeg || which avconv) -loglevel panic -i - -f wav -"
)

set("decoder.file_decoders", ["META","WAV","IMAGE","FLAC","MAD","OGG","XMP","FFMPEG","GSTREAMER"])


meta = ref []
live_meta = ref []
live_stop_record = ref (fun () -> ())

live_src = ref blank()

# Add a skip function to a source
# when it does not have one
# by default
def add_skip_command(~command,s)
	# Register the command:
	server.register(
		usage="skip",
		description="Skip the current song in source.",
		command,
		fun(_) -> begin
			print("Skipping...")
			source.skip(s)
			"OK!"
		end
	)
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


def update_nowplaying(m)
	recode = string.recode(out_enc="UTF-8")
	def f(x)
		(recode(fst(x)),recode(snd(x)))
	end

	m = list.map(f,m)
	m = list.remove_assoc("cover", m)
	m = list.remove_assoc("picture", m)
	meta := m

	data = json_of(compact=true, m)

	# send metadata to server
	print("META: "^snd(http.post(
		data    = data,
		headers = [("Content-Type", "application/json; charset=utf-8")],
		timeout = 10.0,
		"http://#{confstr('server.host', 'localhost')}:#{serverport}/internal/meta"
	)))
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
harbor.http.register(port=port_harbor, method="GET", "/getmeta", get_meta)



def auth_live(user,password)
	print("LIVE: User "^user^" is trying to connect..")

	m = !live_meta
	if m["live_username"] == "" or m["live_username"] == user then

		data = get_process_output("node scripts/auth_live "^quote(user)^" "^quote(password))

		ret = of_json(default=[("error", "JSON error")], data)

		if ret["error"] == "" then
			print("LIVE: User "^ret["live_username"]^" authenticated successfully")
			live_meta := ret
			true
		else
			print("LIVE: User failed to authenticate: "^ret["error"])
			print(data)
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
		("live_name", headers["ice-name"]),
		("live_description", headers["ice-description"]),
		("genre", headers["ice-genre"]),
		("live_url", headers["ice-url"])
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
	live_meta := m
end


def live_start_recording(mm)
	ls = !live_src

	if mm["live_username"] != "" then

		filename = "archive/"^mm["live_username"]^"/%Y-%m-%d/%Y-%m-%d-%H_%M_%S "^mm["live_name"]^".mp3"

		# Record the live stream
		outfile = output.file(
			%mp3.vbr(quality=0, stereo_mode="joint_stereo", internal_quality=0, id3v2=true),
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

	m = list.remove_assoc("live_username", m) # release lock
	live_meta := m
end


# playlists
default = audio_to_stereo(mksafe(playlist(id="default", reload_mode="watch", reload=600, timeout=600., prefix="/audio/", "/home/djazz/.mpd/playlists/radio.m3u")))
#summer = audio_to_stereo(playlist(id="summer", reload_mode="watch", reload=600, timeout=600., prefix="/audio/", "/home/djazz/.mpd/playlists/summer.m3u"))
friendship = audio_to_stereo(amplify(1.1, playlist(id="friendship", reload_mode="watch", reload=600, "friendship.m3u")))

# queue: requests; announce: plays over music
queue = audio_to_stereo(request.equeue(id="request", conservative=true, length=300., timeout=3600.))
announce = audio_to_stereo(request.equeue(id="announce", conservative=true, length=300., timeout=3600.))

add_skip_command(command="request.skip", queue)

songs = default #random(weights=[1,1], [summer,default])

source = fallback([queue, songs])

# scrobble music (last.fm & tunein) but not jingles etc..
source = store_metadata(id="history", size=20, source)
source = on_track(scrobble_nowplaying, source)
source = on_end(delay=0., scrobble_submit, source)

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
	"live",
	id="live",
	buffer = 5.,
	port = port_input,
	auth = auth_live,
	#icy = true, # setting icy to true crashes Liquidsoap :(
	icy_metadata_charset = 'UTF-8',
	metadata_charset = 'UTF-8',
	on_connect = user_connected,
	on_disconnect = user_disconnected
))

live = map_metadata(fun(m) -> !live_meta, live)

live = map_metadata(fun(m) -> begin
	l = ref []
	if m["title"] != "" then
		l := list.add(("title", m["live_name"]^" - "^m["title"]), !l)
	else
		l := list.add(("title", m["live_name"]), !l)
	end

	list.append([
		("artist", m["live_displayname"]),
		("album", m["live_description"])
	], !l)
end, live)

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


out = output.icecast(
	host     = confstr("icecast.host", "localhost"),
	port     = confint("icecast.port", 8000),
	user     = confstr("icecast.mount.username", "source"),
	password = confstr("icecast.mount.password", "hackme"),

	name        = confstr("radio.title", "Parasprite Radio"),
	description = confstr("radio.description", "Liquidsoap Radio!"),
	url         = confstr("radio.url", "http://liquidsoap.fm/"),
	genre       = confstr("radio.genre", "Misc"),
	encoding    = confstr("icecast.encoding", ""),

	connection_timeout = 20.,
	fallible = true
)


clock.assign_new(id="output_clock",[
out(
	mount = "radio",
	%mp3.cbr(
		bitrate = 320,
		#quality = 3,
		stereo = true,
		stereo_mode = "joint_stereo",
		internal_quality = 0,
		id3v2 = true
	),
	source
),

out(
	mount = "radio_normal",
	%mp3.cbr(
		bitrate = 128,
		stereo = true,
		stereo_mode = "joint_stereo",
		internal_quality = 0,
		id3v2 = true
	),
	start = true,
	source
),

out(
	mount = "radio_mobile",
	%fdkaac(
		channels = 2,
		samplerate = 44100,
		bitrate = 64,
		afterburner = true,
		aot="mpeg2_he_aac_v2"
	),
	start = true,
	source
),

out(
	mount = "radio_opus",
	%opus(
		vbr = "none",
		application = "audio",
		complexity = 10,
		max_bandwidth = "full_band",
		samplerate = 48000,
		frame_size = 20.,
		bitrate = 320,
		channels = 2,
		signal = "music"
	),
	start = true,
	source
),

# out(
# 	mount = "radio_flac",
# 	%ogg(%flac(
# 		samplerate = 48000,
# 		channels    = 2,
# 		compression = 7
# 	)),
# 	icy_metadata = "false",
# 	start = true,
# 	source
# )

# a better FLAC encoder
out(
	mount = "radio_flac",
	%external(
		channels = 2,
		samplerate = 44100,
		header = true,
		restart_on_crash = true,
		#restart_on_new_track = false,
		"flac --best --ogg --no-seektable --silent --stdout -"
	),
	icy_metadata = "false",
	format = "audio/ogg",
	start = true,
	source
),

out(
	mount = "radio_vorbis",
	%vorbis(
		channels = 2,
		quality = 1.0
	),
	start = false,
	source
)

])

# to FM transmitter
#output.alsa(id="alsa", bufferize=true, fallible = true, source)
