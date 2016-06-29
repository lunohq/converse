'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

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
  function Context(_ref) {
    var logger = _ref.logger;
    var ctx = (0, _objectWithoutProperties3.default)(_ref, ['logger']);
    (0, _classCallCheck3.default)(this, Context);

    this.logger = logger;
    (0, _assign2.default)(this, ctx);
  }

  (0, _createClass3.default)(Context, [{
    key: 'onError',
    value: function onError(err) {
      this.logger.error('unhandled middleware error', { err: err, ctx: this });
    }
  }]);
  return Context;
}();

exports.default = Context;