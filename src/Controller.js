import Bot, { DISCONNECT, CONNECTED, UNABLE_TO_RTM_START, WS_ERROR } from './Bot'
import Context from './Context'
import Middleware from './Middleware'

const debug = require('debug')('converse:Controller')

class Controller {

  constructor(config) {
    this.config = config

    const { logger, getTeam, onInactive } = config
    // TODO add invariant
    this.getTeam = getTeam
    this.handleInactive = typeof onInactive === 'function' ? onInactive : () => {}
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
      const bot = this.bots[teamId]
      return new Promise((resolve, reject) => {
        if (bot.connected) {
          debug('Team already connected', { teamId })
          resolve(bot)
          return
        }

        debug('Team connecting', { teamId })
        bot.once(CONNECTED, () => {
          debug('Team finished connecting', { teamId })
          resolve(bot)
        })
        bot.once(DISCONNECT, (err) => {
          debug('Can\'t connect team', { teamId })
          reject(err)
        })
      })
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

    debug('Starting bot', { teamId })
    bot.start()

    bot.on(WS_ERROR, (err) => {
      this.logger.error('Bot websocket error', { teamId, err })
    })
    return new Promise((resolve, reject) => {
      bot.on(CONNECTED, () => {
        debug('Bot started', { teamId })
        resolve(bot)
      })
      bot.on(DISCONNECT, (err, code) => {
        this.logger.info('Bot disconnected', { teamId, err, code })
        if (code === 'account_inactive') {
          this.handleInactive(teamId)
        }
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
