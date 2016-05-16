/**
 * Middleware context
 *
 */
class Context {

  constructor({ logger, ...ctx }) {
    this.logger = logger
    Object.assign(this, ctx)
  }

  onerror(err) {
    this.logger.error('unhandled middleware error', err)
  }

}

export default Context
