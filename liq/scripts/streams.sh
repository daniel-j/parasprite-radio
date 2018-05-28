#!/bin/bash

cd "${0%/*}"
cd ../..

streams_dir=`node -e "console.log(require('./scripts/config').server.streams_dir)"`

mkdir -p "$streams_dir/hls/radio"
rm -f "$streams_dir/hls/radio/"*

ffmpeg -hide_banner -loglevel warning \
-f s16le -ar 44100 -ac 2 -channel_layout stereo -i - \
\
-c:a libfdk_aac -profile aac_main -afterburner 1 -b:a 160k -cutoff 18000 -movflags +faststart \
-metadata service_provider="Parasprite Radio" -f hls -hls_time 2 -hls_list_size 20 -hls_wrap 100 -hls_flags delete_segments "$streams_dir/hls/radio/high.m3u8" \
\
-c:a libfdk_aac -profile aac_he_v2 -afterburner 1 -b:a 64k -movflags +faststart \
-metadata service_provider="Parasprite Radio" -f hls -hls_time 5 -hls_list_size 8 -hls_wrap 100 -hls_flags delete_segments "$streams_dir/hls/radio/low.m3u8"

#\
#-c:a libfdk_aac -profile aac_he -b:a 96k -cutoff 16000 -movflags +faststart \
#-metadata service_provider="Parasprite Radio" -f hls -hls_time 4 -hls_list_size 8 -hls_wrap 100 -hls_flags delete_segments "$streams_dir/hls/radio/medium.m3u8" \


rm -f "$streams_dir/hls/radio/"*
