'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('converse:contrib:middleware:receive:identities');

/*eslint-disable no-param-reassign*/

exports.default = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(_ref) {
    var ctx = _ref.ctx;
    var next = _ref.next;
    var rtm, botId, teamId, bot, team, results;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            rtm = ctx.bot.rtm;
            botId = rtm.activeUserId;
            teamId = rtm.activeTeamId;
            bot = {};
            team = {};

            debug('Attaching identities');

            if (!rtm.dataStore) {
              _context.next = 14;
              break;
            }

            _context.next = 9;
            return _promise2.default.all([rtm.dataStore.getUserById(botId), rtm.dataStore.getTeamById(teamId)]);

          case 9:
            results = _context.sent;

            bot = results[0];
            team = results[1];
            _context.next = 15;
            break;

          case 14:
            debug('No datastore configured for rtm');

          case 15:
            ctx.identities = {
              bot: (0, _extends3.default)({
                id: botId
              }, bot),
              team: (0, _extends3.default)({
                id: teamId
              }, team)
            };
            return _context.abrupt('return', next());

          case 17:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  function identities(_x) {
    return ref.apply(this, arguments);
  }

  return identities;
}();
/*eslint-enable no-param-reassign*/