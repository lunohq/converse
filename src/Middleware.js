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

  run({ ctx, ...other }) {
    debug('Running middleware: %s', this.name)
    const fn = compose(this.middleware)
    return fn({ ctx, ...other }).then(res => {
      debug('Finished running middleware: %s', this.name)
      return res
    }).catch(ctx.onerror)
  }

}

export default Middleware
