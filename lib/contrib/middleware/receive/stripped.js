'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

exports.matches = matches;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*eslint-disable no-underscore-dangle*/
/*eslint-disable no-param-reassign*/
function matches(patterns, message) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)(patterns), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var pattern = _step.value;

      if (pattern instanceof RegExp) {
        return !!message._stripped.match(pattern);
      }

      if (pattern === message._stripped) {
        return true;
      }
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

  return false;
}

exports.default = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(_ref) {
    var ctx = _ref.ctx;
    var message = _ref.message;
    var next = _ref.next;

    var botId, text, _stripped;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            botId = ctx.identities.bot.id;

            if (message.text !== undefined) {
              text = message.text;
              _stripped = text.replace(new RegExp('<@' + botId + '>', 'g'), '').replace(/[.,\/#!$\?%\^&\*:{}=\-_`~()\s]/g, '').toLowerCase();

              message._stripped = _stripped;
            }
            return _context.abrupt('return', next());

          case 3:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  function stripped(_x) {
    return ref.apply(this, arguments);
  }

  return stripped;
}();