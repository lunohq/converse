'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _compose = require('./compose');

var _compose2 = _interopRequireDefault(_compose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('converse:Middleware');

var Middleware = function () {
  function Middleware(name) {
    var _this = this;

    (0, _classCallCheck3.default)(this, Middleware);

    this.run = function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(_ref) {
        var ctx = _ref.ctx;
        var other = (0, _objectWithoutProperties3.default)(_ref, ['ctx']);
        var fn, result;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                debug('Running middleware: %s', _this.name);
                fn = (0, _compose2.default)(_this.middleware);
                result = void 0;
                _context.prev = 3;
                _context.next = 6;
                return fn((0, _extends3.default)({ ctx: ctx }, other));

              case 6:
                result = _context.sent;
                _context.next = 12;
                break;

              case 9:
                _context.prev = 9;
                _context.t0 = _context['catch'](3);

                ctx.onError(_context.t0);

              case 12:
                debug('Finished running middleware: %s', _this.name);
                return _context.abrupt('return', result);

              case 14:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, _this, [[3, 9]]);
      }));
      return function (_x) {
        return ref.apply(this, arguments);
      };
    }();

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
  }]);
  return Middleware;
}();

exports.default = Middleware;