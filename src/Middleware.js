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
    const fn = compose(this.middleware)
    return fn({ ctx, ...other }).catch(ctx.onerror).then(res => {
      debug(`Finished running "${this.name}" middleware`)
      return res
    })
  }

}

export default Middleware
