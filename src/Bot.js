import Emitter from 'events'

import { RtmClient, RTM_EVENTS, CLIENT_EVENTS, WebClient, MemoryDataStore } from '@slack/client'

import Context from './Context'

const debug = require('debug')('converse:Bot')

export const DISCONNECT = CLIENT_EVENTS.RTM.DISCONNECT
export const CONNECTED = CLIENT_EVENTS.RTM_CONNECTION_OPENED
export const WS_CLOSE = CLIENT_EVENTS.RTM.WS_CLOSE
export const WS_ERROR = CLIENT_EVENTS.RTM.WS_ERROR
export const HEALTHY = 'healthy'

function send({ ctx, message }) {
  if (ctx.send === false) {
    debug('Dropping message')
    return null
  }

  const { bot } = ctx
  const payload = {
    type: message.type || 'message',
    channel: message.channel,
    text: message.text || null,
    username: message.username || null,
    parse: message.parse || null,
    link_names: message.link_names || null,
    attachments: message.attachments ? JSON.stringify(message.attachments) : null,
    unfurl_links: message.unfurl_links !== undefined ? message.unfurl_links : null,
    unfurl_media: message.unfurl_media !== undefined ? message.unfurl_media : null,
    icon_url: message.icon_url || null,
    icon_emoji: message.icon_emoji || null,
  }

  if (message.icon_url || message.icon_emoji || message.username) {
    payload.as_user = false
  } else {
    payload.as_user = message.as_user || true
  }

  const requiresWeb = (payload.attachments || !payload.as_user)
  if (requiresWeb) {
    debug('Sending message via web api', { payload })
    return bot.api.chat.postMessage(payload.channel, payload.text, payload)
  }

  debug('Sending message via rtm', { payload })
  return bot.rtm.send(payload)
}

class Bot extends Emitter {

  constructor(config) {
    super()
    this.config = config
    this.connected = false

    const { logger, team, receive, send, sent } = config
    // TODO Add invariant checks for the structure of team we expect
    this.config.token = team.token
    this.team = team
    this.logger = logger
    this.config = config !== undefined ? config : {}
    this.identity = {}

    let rtmConfig
    if (config.rtm === undefined) {
      rtmConfig = {
        dataStore: new MemoryDataStore(),
        autoReconnect: true,
      }
    } else {
      rtmConfig = config.rtm
    }

    this.rtm = new RtmClient(this.team.token, rtmConfig)
    this.api = new WebClient(this.team.token)
    this.middleware = {
      receive,
      send,
      sent,
    }
  }

  createContext(opts) {
    return new Context({ logger: this.logger, team: this.team, bot: this, ...opts })
  }

  start() {
    debug('Starting bot', { team: this.team })
    for (const event of Object.values(RTM_EVENTS)) {
      this.rtm.on(event, (message) => this.receive(message))
    }

    // Emit messages related to the lifecylce of the connection
    this.rtm.on(CLIENT_EVENTS.RTM.DISCONNECT, (err, code) => {
      this.connected = false
      this.emit(DISCONNECT, err, code)
    })
    this.rtm.on(CLIENT_EVENTS.RTM.WS_ERROR, (err) => {
      this.connected = false
      this.emit(WS_ERROR, err)
    })
    this.rtm.on(CLIENT_EVENTS.RTM.WS_CLOSE, (code, reason) => {
      this.connected = false
      this.emit(WS_CLOSE, code, reason)
    })
    this.rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
      debug('Fetching identity', { userId: this.rtm.activeUserId })
      this.identity = this.rtm.dataStore.getUserById(this.rtm.activeUserId)
      if (!this.identity) {
        this.logger.warning('Failed to find identity', { userId: this.rtm.activeUserId })
      } else {
        debug('Attached identity', { identity: this.identity })
      }
      this.connected = true
      this.emit(CONNECTED)
    })
    this.rtm.on(CLIENT_EVENTS.RTM.PONG, () => this.emit(HEALTHY))
    this.rtm.start()
  }

  receive(message) {
    debug('Received message', { team: this.team, message })
    const ctx = this.createContext({ message })
    return this.middleware.receive.run({ ctx, message })
  }

  reply(source, response) {
    let message = {}
    if (typeof response === 'string') {
      message.text = response
    } else {
      message = response
    }

    message.channel = source.channel
    debug('Reply', { team: this.team, message, source, response })
    return this.send(source, message)
  }

  replyWithTyping(source, response) {
    this.startTyping(source)
    return this.reply(source, response)
  }

  startTyping(source) {
    this.reply(source, { type: 'typing' })
  }

  send = async (source, message) => {
    debug('Send', { team: this.team, message, source })
    const ctx = this.createContext({ message })
    await this.middleware.send.run({ ctx, message, source })
    const response = await send({ ctx, message })
    debug('Sent', { response })
    if (response !== null) {
      return this.middleware.sent.run({ ctx, message, source, response }).then(() => Promise.resolve(response))
    }
    return Promise.resolve()
  }

}

export default Bot
