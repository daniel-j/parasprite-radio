#!/bin/bash
export PATH=node_modules/.bin:$PATH

#set -e
output=""
if [ "$1" = "style" ]; then
	output=`stylus --deps "$2"`
elif [ "$1" = "script" ]; then
	output=`browserify --deps -t [ coffeeify ] --extension='.coffee' "$2" 2> /dev/null`
else
	output="$2"
fi

if [ "$output" = "" ]; then
	output="$2"
fi
echo $output
