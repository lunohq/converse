import Bot, { DISCONNECT, AUTHENTICATED } from './Bot'
import Context from './Context'
import Middleware from './Middleware'

const debug = require('debug')('converse:controller')

class Controller {

  constructor(config) {
    this.config = config

    const { logger, getTeam, } = config
    // TODO add invariant
    this.getTeam = getTeam
    this.bots = {}
    this.logger = typeof logger === 'object' ? logger : console
    this.middleware = {
      spawn: new Middleware('spawn'),
      receive: new Middleware('receive'),
      send: new Middleware('send'),
      sent: new Middleware('sent'),
    }
  }

  start = async () => {}

  spawn = async (teamId) => {
    debug('Spawning bot for team', { teamId })

    if (this.bots[teamId] !== undefined) {
      debug('Team already connected', { teamId })
      return this.bots[teamId]
    }

    debug('Retrieving team', { teamId })
    const team = await this.getTeam(teamId)

    const ctx = new Context({ logger: this.logger, team })
    await this.middleware.spawn.run({ ctx, team })

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

    return new Promise((resolve, reject) => {
      bot.on(AUTHENTICATED, () => {
        debug('Bot started', { teamId })
        resolve(bot)
      })
      bot.on(DISCONNECT, (err, code) => {
        this.logger.info('Bot disconnected', { teamId, err, code })
        delete this.bots[teamId]
        reject(err, code)
      })
    })
  }

  getBot(teamId) {
    return this.bots[teamId]
  }

}

export default Controller
