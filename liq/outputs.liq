
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

mumbleOut = output.external(id="mumble",
	%external(
		channels=1,
		samplerate=48000,
		header=false,
		restart_on_crash=true,
		process="node scripts/mumble.js"
	),
	start=confbool('mumble.enable'),
	"true"
)

if inDev then
	clock.assign_new(id="output_clock",[
		out(
			mount = "radio_dev",
			%mp3.cbr(
				bitrate = 128,
				stereo = true,
				stereo_mode = "joint_stereo",
				id3v2 = true
			),
			source
		)
	])
else

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
			bitrate = 128,
			channels = 2,
			signal = "music"
		),
		start = false,
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
		mount = "radio_mobile_vorbis",
		%vorbis(
			channels = 2,
			quality = 0.1
		),
		start = true,
		source
	)

	])

	# to FM transmitter
	#output.alsa(id="alsa", bufferize=true, fallible = true, source)
end


clock.assign_new(sync=false,[mumbleOut(mean(mksafe(buffer(buffer=5.0,source))))])
