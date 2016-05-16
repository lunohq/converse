'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

exports.default = compose;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('converse:compose');

/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array} middleware
 * @return {Function}
 *
 */

function compose(middleware) {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!');
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)(middleware), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var fn = _step.value;

      if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!');
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return function _compose(_ref) {
    var next = _ref.next;
    var other = (0, _objectWithoutProperties3.default)(_ref, ['next']);

    // last called middleware #
    var index = -1;
    function dispatch(i) {
      if (i <= index) return _promise2.default.reject(new Error('next() called multiple times'));
      index = i;
      var fn = middleware[i] || next;
      if (!fn) return _promise2.default.resolve();
      debug('Running middleware: %s (%s/%s)', fn.name || '-', i + 1, middleware.length);
      try {
        return _promise2.default.resolve(fn((0, _extends3.default)({
          next: function next() {
            return dispatch(i + 1);
          }
        }, other)));
      } catch (err) {
        return _promise2.default.reject(err);
      }
    }
    return dispatch(0);
  };
}