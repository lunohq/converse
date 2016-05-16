const debug = require('debug')('converse:compose')

/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array} middleware
 * @return {Function}
 *
 */

export default function compose(middleware) {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
  }

  return function _compose({ next, ...other }) {
    // last called middleware #
    let index = -1
    function dispatch(i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      const fn = middleware[i] || next
      debug('Running middleware: %s (%s/%s)', fn.name || '-', i + 1, middleware.length)
      if (!fn) return Promise.resolve()
      try {
        return Promise.resolve(fn({
          next: function next() {
            return dispatch(i + 1)
          },
          ...other,
        }))
      } catch (err) {
        return Promise.reject(err)
      }
    }
    return dispatch(0)
  }
}
