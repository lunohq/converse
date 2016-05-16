'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _compose = require('./compose');

var _compose2 = _interopRequireDefault(_compose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('converse:middleware');

var Middleware = function () {
  function Middleware() {
    (0, _classCallCheck3.default)(this, Middleware);

    this.middleware = [];
  }

  (0, _createClass3.default)(Middleware, [{
    key: 'use',
    value: function use(fn) {
      debug('use %s', fn._name || fn.name || '-');
      this.middleware.push(fn);
      return this;
    }
  }, {
    key: 'run',
    value: function run(_ref) {
      var ctx = _ref.ctx;
      var last = _ref.last;
      var other = (0, _objectWithoutProperties3.default)(_ref, ['ctx', 'last']);

      var middleware = this.middleware;
      if (last) {
        middleware = [].concat((0, _toConsumableArray3.default)(this.middleware), [last]);
      }
      var fn = (0, _compose2.default)(middleware);
      return fn((0, _extends3.default)({ ctx: ctx }, other)).catch(ctx.onerror);
    }
  }]);
  return Middleware;
}();

exports.default = Middleware;