const debug = require('debug')('contrib:middleware:receive:events')

function replaceDirectMention(mention, text) {
  return text.replace(mention, '')
    .replace(/^\s+/, '')
    .replace(/^:\s+/, '')
    .replace(/^\s+/, '')
}

/*eslint-disable no-param-reassign*/
export default async function events({ ctx, message, next }) {
  const { identities } = ctx
  if (!identities) {
    debug('Not running, requires `identities` on context')
    return next()
  }

  const botId = identities.bot.id
  const directMention = new RegExp(`^\<\@${botId}\>`, 'i')
  if (message.type === 'message') {
    if (message.text) {
      message.text = message.text.trim()
    }

    if (message.subtype === 'channel_join') {
      if (message.user === botId) {
        message.event = 'bot_channel_join'
      } else {
        message.event = 'user_channel_join'
      }
    } else if (message.subtype === 'group_join') {
      if (message.user === botId) {
        message.event = 'bot_group_join'
      } else {
        message.event = 'user_group_join'
      }
    } else if (message.user === botId) {
      message.event = 'self'
    } else if (message.channel.match(/^D/)) {
      message.text = replaceDirectMention(directMention, message.text)
      message.event = 'direct_message'
    } else {
      const mention = new RegExp(`\<\@${botId}\>`, 'i')
      if (message.text.match(directMention)) {
        message.text = replaceDirectMention(directMention, message.text)
        message.event = 'direct_message'
      } else if (message.text.match(mention)) {
        message.event = 'mention'
      } else {
        message.event = 'ambient'
      }
    }
  }
  return next()
}
/*eslint-enable no-param-reassign*/
