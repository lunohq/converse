import compose from './compose'
const debug = require('debug')('converse:middleware')

class Middleware {

  constructor() {
    this.middleware = []
  }

  use(fn) {
    debug('use %s', fn._name || fn.name || '-')
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
