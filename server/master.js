'use strict'

import path from 'path'
import cluster from 'cluster'
import config from '../scripts/config'
import pjson from '../package.json'
import colors from 'colors/safe'

// const numCores = require('os').cpus().length

let rl
const workers = []

function startReadline () {
  const readline = require('readline')
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  rl.setPrompt('> ')
  rl.on('line', (line) => {
    if (line === 'reload') {
      workers.forEach((w, i) => {
        spawnWorker(w)
      })
      workers.length = 0
    }
    rl.prompt()
  })
  rl.on('close', () => {
    rl.output.write('\n')
    process.exit(0)
  })
  rl.prompt()

  const realConsoleLog = console.log
  console.log = function () {
    rl.output.write('\x1b[2K\r')
    realConsoleLog.apply(this, arguments)
    rl.prompt(true)
  }
  const realConsoleWarn = console.warn
  console.log = function () {
    rl.output.write('\x1b[2K\r')
    realConsoleWarn.apply(this, arguments)
    rl.prompt(true)
  }
  const realConsoleError = console.error
  console.log = function () {
    rl.output.write('\x1b[2K\r')
    realConsoleError.apply(this, arguments)
    rl.prompt(true)
  }
}

async function initialize () {
  try {
    const knex = require('knex')(require('../knexfile'))
    args.verbose && console.log('Initializing database...')
    await knex.migrate.latest()
    args.verbose && console.log('Database initialized')
    await knex.destroy()
  } catch (err) {
    console.error(colors.red('Cluster: Database error:'), err)
  }
  startReadline()
  // Fork workers.
  // for now, only one =)
  // for (let i = 0; i < numCores; i++)
  spawnWorker()
}

function spawnWorker (oldWorker) {
  const w = cluster.fork()
  w.process.stdout.on('data', (data) => {
    rl.output.write('\x1b[2K\r')
    process.stdout.write(data)
    rl.prompt(true)
  })
  w.process.stderr.on('data', (data) => {
    rl.output.write('\x1b[2K\r')
    process.stderr.write(data)
    rl.prompt(true)
  })
  args.verbose && console.log(colors.cyan('Cluster: Starting worker process ' + w.process.pid + '...'))

  w.on('message', (message) => {
    if (message === 'started') {
      workers.push(w)
      args.verbose && console.log(colors.green('Cluster: Started worker process ' + w.process.pid))
      if (oldWorker) {
        args.verbose && console.log(colors.yellow('Cluster: Stopping worker process ' + oldWorker.process.pid))
        oldWorker.send('stop')
      }
    }
  })
  w.send(args)
  return w
}

cluster.setupMaster({
  stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  exec: path.join(__dirname, './worker.js')
})

let args = require('commander')
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
  let extra = ((code || '') + ' ' + (signal || '')).trim()
  console.error(colors.red('Cluster: Worker process ' + worker.process.pid + ' exited ' + (extra ? '(' + extra + ')' : '')))
  let index = workers.indexOf(worker)
  if (index !== -1) workers.splice(index, 1)
  if (code === 0) {
    return
  }
  setTimeout(() => {
    spawnWorker()
  }, 10 * 1000)
})

initialize()
