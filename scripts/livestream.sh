#!/bin/bash

cd "${0%/*}"
cd ..

streams_dir="$1"
name="$2"

mkdir -pv "$streams_dir/hls/livestream"
rm -f "$streams_dir/hls/livestream/$name"*

/home/djazz/bin/ffmpeg -hide_banner -loglevel error -i rtmp://localhost/live/$name \
-c:v copy -c:a copy \
-f hls -hls_time 2 -hls_list_size 4 -hls_wrap 50 -hls_flags delete_segments "$streams_dir/hls/livestream/$name.m3u8" \
-vf fps=5 -update 1 "$streams_dir/hls/livestream/$name.jpg"

rm -f "$streams_dir/hls/livestream/$name"*
