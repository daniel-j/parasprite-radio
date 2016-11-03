'use strict'

import path from 'path'
import cluster from 'cluster'
import config from '../scripts/config'
import pjson from '../package.json'
import colors from 'colors/safe'

// const numCores = require('os').cpus().length

let args

async function initialize () {
  const knex = require('knex')(require('../knexfile'))
  args.verbose && console.log('Initializing database...')
  await knex.migrate.latest()
  args.verbose && console.log('Database initialized')
  await knex.destroy()
}

function spawnWorker () {
  const w = cluster.fork()
  args.verbose && console.log(colors.green('Cluster: Started worker process ' + w.process.pid))
  w.send(args)
  return w
}

if (cluster.isMaster) {
  args = require('commander')
    .command('startserver')
    .version(pjson.version)
    .option('-d, --dev', 'run in debug mode')
    .option('-v, --verbose', 'run in verbose mode')
    .option('-p, --port <number>', 'set the server http port', config.server.port || 8002)
    .parse(process.argv)

  // process will exit here if commander help is displayed

  args = {
    dev: args.dev,
    verbose: args.verbose,
    port: args.port
  }

  console.log(colors.yellow.bold('Parasprite Radio'))

  if (args.dev) {
    console.log(colors.cyan('Running in debug mode'))
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error(colors.red('Cluster: Worker process ' + worker.process.pid + ' died'))
    setTimeout(() => {
      spawnWorker()
    }, 10 * 1000)
  })

  initialize().then(() => {
    // Fork workers.
    // for now, only one =)
    // for (let i = 0; i < numCores; i++)
    spawnWorker()
  })
} else {
  process.once('message', (args) => {
    if (args.dev) {
      process.env.NODE_ENV = 'development'
    } else {
      process.env.NODE_ENV = 'production'
    }

    const server = require(path.join(__dirname, 'server'))
    server.startServer(args).catch((err) => {
      console.error('' + err, err.stack || '')
    })
  })
}
