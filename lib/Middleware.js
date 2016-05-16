'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

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
  function Middleware(name) {
    (0, _classCallCheck3.default)(this, Middleware);

    this.middleware = [];
    this.name = name;
  }

  (0, _createClass3.default)(Middleware, [{
    key: 'use',
    value: function use(fn) {
      debug('%s use %s', this.name || '-', fn.name || '-');
      this.middleware.push(fn);
      return this;
    }
  }, {
    key: 'run',
    value: function run(_ref) {
      var _this = this;

      var ctx = _ref.ctx;
      var other = (0, _objectWithoutProperties3.default)(_ref, ['ctx']);

      debug('Running middleware: %s', this.name);
      var fn = (0, _compose2.default)(this.middleware);
      return fn((0, _extends3.default)({ ctx: ctx }, other)).then(function (res) {
        debug('Finished running middleware: %s', _this.name);
        return res;
      }).catch(ctx.onerror);
    }
  }]);
  return Middleware;
}();

exports.default = Middleware;