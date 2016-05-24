'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Flow = undefined;

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('bot:flows:middleware');

var Flow = exports.Flow = function Flow() {
  var _this = this;

  (0, _classCallCheck3.default)(this, Flow);
  this.match = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', false);

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this);
  }));
  this.run = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this);
  }));
};

exports.default = function (_ref) {
  var registered = _ref.flows;
  return function () {
    var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(_ref2) {
      var ctx = _ref2.ctx;
      var message = _ref2.message;
      var next = _ref2.next;

      var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, flow, match;

      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _iteratorNormalCompletion = true;
              _didIteratorError = false;
              _iteratorError = undefined;
              _context3.prev = 3;
              _iterator = (0, _getIterator3.default)(registered);

            case 5:
              if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                _context3.next = 20;
                break;
              }

              flow = _step.value;

              debug('Checking flow: %s', flow.constructor.name);
              _context3.next = 10;
              return flow.match({ ctx: ctx, message: message });

            case 10:
              match = _context3.sent;

              if (!match) {
                _context3.next = 17;
                break;
              }

              debug('Running flow: %s', flow.constructor.name);
              _context3.next = 15;
              return flow.run({ ctx: ctx, message: message });

            case 15:
              debug('Ran flow: %s', flow.constructor.name);
              return _context3.abrupt('break', 20);

            case 17:
              _iteratorNormalCompletion = true;
              _context3.next = 5;
              break;

            case 20:
              _context3.next = 26;
              break;

            case 22:
              _context3.prev = 22;
              _context3.t0 = _context3['catch'](3);
              _didIteratorError = true;
              _iteratorError = _context3.t0;

            case 26:
              _context3.prev = 26;
              _context3.prev = 27;

              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }

            case 29:
              _context3.prev = 29;

              if (!_didIteratorError) {
                _context3.next = 32;
                break;
              }

              throw _iteratorError;

            case 32:
              return _context3.finish(29);

            case 33:
              return _context3.finish(26);

            case 34:
              return _context3.abrupt('return', next());

            case 35:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, this, [[3, 22, 26, 34], [27,, 29, 33]]);
    }));

    function flows(_x) {
      return ref.apply(this, arguments);
    }

    return flows;
  }();
};