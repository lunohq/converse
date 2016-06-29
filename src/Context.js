/**
 * Middleware context
 *
 */
class Context {

  constructor({ logger, ...ctx }) {
    this.logger = logger
    Object.assign(this, ctx)
  }

  onError(err) {
    this.logger.error('unhandled middleware error', { err, ctx: this })
  }

}

export default Context
