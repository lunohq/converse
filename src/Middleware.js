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

  run({ ctx, last, ...other }) {
    let middleware = this.middleware
    if (last) {
      middleware = [...this.middleware, last]
    }
    const fn = compose(middleware)
    return fn({ ctx, ...other }).catch(ctx.onerror)
  }

}

export default Middleware
