/*eslint-disable no-underscore-dangle*/
/*eslint-disable no-param-reassign*/
export function matches(patterns, message) {
  for (const pattern of patterns) {
    if (pattern instanceof RegExp) {
      return !!message._stripped.match(pattern)
    }

    if (pattern === message._stripped) {
      return true
    }
  }
  return false
}

export default async function stripped({ ctx, message, next }) {
  const { identities: { bot: { id: botId } } } = ctx
  if (message.text !== undefined) {
    const { text } = message
    const stripped = text.replace(new RegExp(`\<@${botId}\>`, 'g'), '').replace(/[.,\/#!$\?%\^&\*:{}=\-_`~()\s]/g, '').toLowerCase()
    message._stripped = stripped
  }
  return next()
}
