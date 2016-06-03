'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sign = sign;
exports.unsign = unsign;

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function sha1(str) {
  return _crypto2.default.createHash('sha1').update(str).digest('hex');
}

/**
 * Sign the given `val` with `secret`.
 *
 * @param {String} val
 * @param {String} secret
 * @return {String}
 */
/**
 * Ported from: https://github.com/tj/node-cookie-signature
 */
function sign(val, secret) {
  if (typeof val !== 'string') throw new TypeError('Cookie value must be provided as a string.');
  if (typeof secret !== 'string') throw new TypeError('Secret string must be provided.');
  var sig = _crypto2.default.createHmac('sha256', secret).update(val).digest('hex');
  return val + '.' + sig;
}

/**
 * Unsign and decode the given `val` with `secret`,
 * returning `false` if the signature is invalid.
 *
 * @param {String} val
 * @param {String} secret
 * @return {String|Boolean}
 */
function unsign(val, secret) {
  if (typeof val !== 'string') throw new TypeError('Signed cookie string must be provided.');
  if (typeof secret !== 'string') throw new TypeError('Secret string must be provided.');
  var str = val.slice(0, val.lastIndexOf('.'));
  var mac = sign(str, secret);
  return sha1(mac) === sha1(val) ? str : false;
}

exports.default = {
  sign: sign,
  unsign: unsign
};