import bluebird from 'bluebird'
import redis from 'redis'

import Bot from './Bot'
import Middleware from './Middleware'

const debug = require('debug')('converse:controller')

bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

// for PONG events, write to a hash of converse:pong:<team_id>: <connection id>: <last timestamp>, this will let us show that the bot is currently connected.
//
// these should expire after a certain amount of time.
//
//
// this will also let watchdog ensure that we always have two connections open.

class Controller {

  constructor({ config, queue, getTeam, solo }) {
    // TODO add invariant
    this.queue = queue
    this.getTeam = getTeam
    // TODO pass in options
    this.redis = redis.createClient()
    this.bots = {}
    this.solo = solo !== undefined ? solo : false
    this.receive = new Middleware()
    this.send = new Middleware()
    this.config = config !== undefined ? config : {}
  }

  start = async () => {
    // TODO use lrange and ltrim to fetch an initial number of users
    try {
      await this.listen()
    } catch (err) {
      throw err
    }
  }

  listen = async () => {
    debug('Listening for new connections')
    const result = await this.redis.blpopAsync(this.queue, 0)
    const teamId = result[1]
    debug('Received team from queue', { teamId })
    const connected = await this.spawn(teamId)
    if (!connected && !this.solo) {
      debug('Pushing team back into queue', { teamId })
      await this.redis.rpushAsync(this.queue, teamId)
    }
    return await this.listen()
  }

  spawn = async (teamId) => {
    debug('Spawning bot for team', { teamId })
    if (this.bots[teamId] !== undefined) {
      debug('Team already connected', { teamId })
      return false
    }

    debug('Retrieving team', { teamId })
    const team = await this.getTeam(teamId)
    debug('Creating bot', { team })
    const bot = new Bot({
      team,
      config: this.config,
      receive: this.receive,
      send: this.send,
    })
    this.bots[teamId] = bot
    debug('Starting bot', { bot })
    bot.start()
    debug('Bot started', { teamId })
    return true
  }

}

export default Controller
