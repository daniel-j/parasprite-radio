
import cluster from 'cluster'
import config from '../scripts/config'
import pjson from '../package.json'

// const numCores = require('os').cpus().length

let args

function spawnWorker () {
  const w = cluster.fork()
  w.send(args)
  return w
}

if (cluster.isMaster) {
  args = require('commander')
    .command('radio')
    .version(pjson.version)
    .option('-d, --dev', 'run in development/debug mode')
    .option('-p, --port <number>', 'set the server http port', config.server.port || 8000)
    .parse(process.argv)

  // process will exit here if commander help is displayed

  args = {
    dev: args.dev,
    port: args.port,
    update: args.update
  }

  // Fork workers.
  // for now, only one =)
  // for (let i = 0; i < numCores; i++)
  spawnWorker()

  cluster.on('exit', function (worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died')
    setTimeout(function () {
      spawnWorker()
    }, 5000)
  })
} else {
  process.once('message', function (args) {
    require('./server').startServer(args).catch(function (err) {
      console.error('' + err, err.stack || '')
    })
  })
}
