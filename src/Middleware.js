import compose from './compose'
const debug = require('debug')('converse:middleware')

class Middleware {

  constructor(name) {
    this.middleware = []
    this.name = name
  }

  use(fn) {
    debug('%s use %s', this.name || '-', fn.name || '-')
    this.middleware.push(fn)
    return this
  }

  run = async ({ ctx, ...other }) => {
    debug('Running middleware: %s', this.name)
    const fn = compose(this.middleware)
    let result
    try {
      result = await fn({ ctx, ...other })
    } catch (err) {
      console.log('bla', err)
      ctx.onerror(err)
    }
    debug('Finished running middleware: %s', this.name)
    return result
  }

}

export default Middleware
