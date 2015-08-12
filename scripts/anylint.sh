#!/bin/bash
export PATH=node_modules/.bin:$PATH

set -e

list=`browserify --list -t [ coffeeify ] --extension='.coffee' "$1"`

jshint --verbose $(echo $list | tr ' ' '\n' | grep .js)
coffeelint $(echo $list | tr ' ' '\n' | grep .coffee)


