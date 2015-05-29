#!/bin/bash

filename=`basename "$1"`
extension="${filename#*.}"
tmpfile=`mktemp -u --suffix=".$extension"`

cp "$1" "$tmpfile"
echo $tmpfile
