/**
 * Ported from: https://github.com/tj/node-cookie-signature
 */
import crypto from 'crypto'

function sha1(str) {
  return crypto.createHash('sha1').update(str).digest('hex')
}

/**
 * Sign the given `val` with `secret`.
 *
 * @param {String} val
 * @param {String} secret
 * @return {String}
 */
export function sign(val, secret) {
  if (typeof val !== 'string') throw new TypeError('Cookie value must be provided as a string.')
  if (typeof secret !== 'string') throw new TypeError('Secret string must be provided.')
  const sig = crypto
    .createHmac('sha256', secret)
    .update(val)
    .digest('hex')
  return `${val}.${sig}`
}

/**
 * Unsign and decode the given `val` with `secret`,
 * returning `false` if the signature is invalid.
 *
 * @param {String} val
 * @param {String} secret
 * @return {String|Boolean}
 */
export function unsign(val, secret) {
  if (typeof val !== 'string') throw new TypeError('Signed cookie string must be provided.')
  if (typeof secret !== 'string') throw new TypeError('Secret string must be provided.')
  const str = val.slice(0, val.lastIndexOf('.'))
  const mac = sign(str, secret)
  return sha1(mac) === sha1(val) ? str : false
}

export default {
  sign,
  unsign,
}
