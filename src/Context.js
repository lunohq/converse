/**
 * Middleware context
 *
 */
class Context {

  constructor(context) {
    Object.assign(this, context)
  }

  onerror(err) {
    console.error('unhandled middleware error', err)
  }

}

export default Context
