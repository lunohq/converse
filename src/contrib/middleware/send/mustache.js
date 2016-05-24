/*eslint-disable no-underscore-dangle*/
/*eslint-disable no-param-reassign*/
import { default as m } from 'mustache'

const debug = require('debug')('converse:contrib:middleware:send:mustache')

export default function mustache({ ctx, message, next }) {
  if (message.text && message._vars) {
    debug('Running mustache middleware', { message })
    try {
      message.text = m.render(message.text, { ...message._vars })
    } catch (err) {
      ctx.logger.error('Error rendering mustache template', { err, message })
    }
    debug('Ran mustache middleware', { message })
  }
  return next()
}
