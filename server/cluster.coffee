
cluster = require 'cluster'

numCores = require('os').cpus().length


if cluster.isMaster
	# Fork workers.
	# for now, only one =)
	cluster.fork() #for i in [0..numCores]

	cluster.on 'exit', (worker, code, signal) ->
		console.log 'worker ' + worker.process.pid + ' died'
		setTimeout () ->
			cluster.fork()
		, 5000

else

	require './index'
