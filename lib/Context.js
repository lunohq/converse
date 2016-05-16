'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Middleware context
 *
 */

var Context = function () {
  function Context(context) {
    (0, _classCallCheck3.default)(this, Context);

    (0, _assign2.default)(this, context);
  }

  (0, _createClass3.default)(Context, [{
    key: 'onerror',
    value: function onerror(err) {
      console.error('unhandled middleware error', err);
    }
  }]);
  return Context;
}();

exports.default = Context;