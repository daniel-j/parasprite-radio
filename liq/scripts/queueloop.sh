#!/bin/bash
 
while true
do
	mpc -q idle playlist > /dev/null
	filename=`mpc -q playlist -f %file% | head -n1`
	echo "Queueing $filename"
	node queue "$filename"
	sleep 1
	mpc -q clear
done
