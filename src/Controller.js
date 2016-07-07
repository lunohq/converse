import Bot, { DISCONNECT, CONNECTED, WS_ERROR, WS_CLOSE, HEALTHY } from './Bot'
import Context from './Context'
import Middleware from './Middleware'

const debug = require('debug')('converse:Controller')

class Controller {

  constructor(config) {
    this.config = config

    const { logger, getTeam, onInactive, onHealthy, onWarning, onDisconnect, onConnect } = config
    // TODO add invariant
    this.getTeam = getTeam
    // TODO these should be emitted as events
    this.handleHealthy = typeof onHealthy === 'function' ? onHealthy : () => {}
    this.handleInactive = typeof onInactive === 'function' ? onInactive : () => {}
    this.handleWarning = typeof onWarning === 'function' ? onWarning : () => {}
    this.handleDisconnect = typeof onDisconnect === 'function' ? onDisconnect : () => {}
    this.handleConnect = typeof onConnect === 'function' ? onConnect : () => {}
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

    bot.on(HEALTHY, () => this.handleHealthy(bot))
    bot.on(WS_ERROR, (err) => {
      this.handleWarning({ bot, err })
    })
    bot.on(WS_CLOSE, (code, reason) => {
      this.handleWarning({ bot, code, reason })
    })
    return new Promise((resolve, reject) => {
      bot.on(CONNECTED, () => {
        this.logger.info('Bot connected', { teamId })
        this.handleConnect(bot)
        resolve(bot)
      })
      bot.on(DISCONNECT, (err, code) => {
        this.logger.info('Bot disconnected', { teamId, err, code })
        this.handleDisconnect({ bot, err, code })
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
