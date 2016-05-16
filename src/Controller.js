import bluebird from 'bluebird'
import redis from 'redis'

import Bot, { DISCONNECT } from './Bot'
import Middleware from './Middleware'

const debug = require('debug')('converse:controller')

bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

class Controller {

  constructor(config) {
    this.config = config

    const { redis: redisConfig, logger, queue, getTeam, solo } = config
    // TODO add invariant
    this.queue = queue
    this.getTeam = getTeam
    this.redis = redis.createClient(redisConfig)
    this.bots = {}
    this.solo = solo !== undefined ? solo : false
    this.logger = typeof logger === 'object' ? logger : console
    this.middleware = {
      spawning: new Middleware('spawning'),
      receive: new Middleware('receive'),
      send: new Middleware('send'),
      sent: new Middleware('sent'),
    }
  }

  start = async () => {
    this.listen()
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
    return this.listen()
  }

  spawn = async (teamId) => {
    debug('Spawning bot for team', { teamId })

    if (this.bots[teamId] !== undefined) {
      debug('Team already connected', { teamId })
      return false
    }

    debug('Retrieving team', { teamId })
    const team = await this.getTeam(teamId)

    await this.middleware.spawning.run({ team })

    debug('Creating bot', { team })
    const bot = new Bot({
      team,
      logger: this.logger,
      receive: this.middleware.receive,
      send: this.middleware.send,
      sent: this.middleware.sent,
    })
    this.bots[teamId] = bot

    debug('Starting bot', { bot })
    bot.start()
    bot.on(DISCONNECT, () => {
      debug('Bot disconnected', { teamId })
      delete this.bots[teamId]
    })

    debug('Bot started', { teamId })
    return bot
  }

  getBot(teamId) {
    return this.bots[teamId]
  }

}

export default Controller
