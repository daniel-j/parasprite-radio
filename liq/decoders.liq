
def file_metadata(file)
	of_json(default=[], get_process_output("node scripts/metadata "^string.quote(file)))
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
	fun(f) -> "xmp --nocmd -o - -d wav "^string.quote(f)^" 2>/dev/null"
)
#add_metadata_resolver("XMP", file_metadata)

set("decoder.file_decoders", ["META","WAV","IMAGE","FLAC","MAD","OGG","XMP","FFMPEG"])
