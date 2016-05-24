const debug = require('debug')('bot:flows:middleware')

export default async ({ flows }) => async ({ ctx, message, next }) => {
  for (const flow of flows) {
    debug('Checking flow: %s', flow.constructor.name)
    const match = await flow.match({ ctx, message })
    if (match) {
      debug('Running flow: %s', flow.constructor.name)
      await flow.run({ ctx, message })
      debug('Ran flow: %s', flow.constructor.name)
      break
    }
  }
  return next()
}
