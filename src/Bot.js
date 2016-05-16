import { RtmClient, RTM_EVENTS, WebClient } from '@slack/client'

import Context from './Context'

const debug = require('debug')('converse:bot')

function send({ ctx, message }) {
  if (ctx.send === false) return

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
    if (!bot.config.token) {
      throw new Error('No token for web api')
    }
    return bot.api.chat.postMessage(payload.channel, payload.text, payload)
  } else {
    return bot.rtm.send(payload)
  }
}

class Bot {

  constructor(config) {
    this.config = config

    const { team, receive, send } = config
    // TODO Add invariant checks for the structure of team we expect
    this.config.token = team.token
    this.team = team
    this.config = config !== undefined ? config : {}

    this.rtm = new RtmClient(this.team.token, config.rtm)
    this.api = new WebClient(this.team.token)
    this.middleware = {
      receive,
      send,
    }
  }

  createContext() {
    return new Context({ team: this.team, bot: this })
  }

  start() {
    debug('Starting bot', { team: this.team })
    this.rtm.start()
    for (const event of Object.values(RTM_EVENTS)) {
      this.rtm.on(event, (message) => this.receive(message))
    }

    // TODO emit events for when the bot gets disconnected so the controller can
    // remove it from its list of connected clients
    // https://github.com/slackhq/node-slack-client/blob/master/lib/clients/events/client.js#L26
  }

  receive(message) {
    debug('Bot.receive', { team: this.team, message })
    const ctx = this.createContext()
    this.middleware.receive.run({ ctx, message })
  }

  reply(source, response) {
    let message = {}
    if (typeof response === 'string') {
      message.text = response
    } else {
      message = response
    }

    message.channel = source.channel
    debug('Bot.reply', { team: this.team, message, source, response })
    return this.send(message)
  }

  startTyping(source) {
    return this.reply(source, { type: 'typing' })
  }

  send(message) {
    debug('Bot send', { team: this.team, message })
    const ctx = this.createContext()
    return this.middleware.send.run({ ctx, message }).then(() => send({ ctx, message }))
  }

}

export default Bot
