'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

exports.default = mustache;

var _mustache = require('mustache');

var _mustache2 = _interopRequireDefault(_mustache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('converse:contrib:middleware:send:mustache'); /*eslint-disable no-underscore-dangle*/
/*eslint-disable no-param-reassign*/


function mustache(_ref) {
  var ctx = _ref.ctx;
  var message = _ref.message;
  var next = _ref.next;

  if (message.text && message._vars) {
    debug('Running mustache middleware', { message: message });
    try {
      message.text = _mustache2.default.render(message.text, (0, _extends3.default)({}, message._vars));
    } catch (err) {
      ctx.logger.error('Error rendering mustache template', { err: err, message: message });
    }
    debug('Ran mustache middleware', { message: message });
  }
  return next();
}