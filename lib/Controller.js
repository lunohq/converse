'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

var _Bot = require('./Bot');

var _Bot2 = _interopRequireDefault(_Bot);

var _Middleware = require('./Middleware');

var _Middleware2 = _interopRequireDefault(_Middleware);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('converse:controller');

_bluebird2.default.promisifyAll(_redis2.default.RedisClient.prototype);
_bluebird2.default.promisifyAll(_redis2.default.Multi.prototype);

var Controller = function () {
  function Controller(config) {
    var _this = this;

    (0, _classCallCheck3.default)(this, Controller);
    this.start = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _this.listen();

            case 1:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }));
    this.listen = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
      var result, teamId, connected;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              debug('Listening for new connections');
              _context2.next = 3;
              return _this.redis.blpopAsync(_this.queue, 0);

            case 3:
              result = _context2.sent;
              teamId = result[1];

              debug('Received team from queue', { teamId: teamId });
              _context2.next = 8;
              return _this.spawn(teamId);

            case 8:
              connected = _context2.sent;

              if (!(!connected && !_this.solo)) {
                _context2.next = 13;
                break;
              }

              debug('Pushing team back into queue', { teamId: teamId });
              _context2.next = 13;
              return _this.redis.rpushAsync(_this.queue, teamId);

            case 13:
              return _context2.abrupt('return', _this.listen());

            case 14:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this);
    }));

    this.spawn = function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(teamId) {
        var team, bot;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                debug('Spawning bot for team', { teamId: teamId });

                if (!(_this.bots[teamId] !== undefined)) {
                  _context3.next = 4;
                  break;
                }

                debug('Team already connected', { teamId: teamId });
                return _context3.abrupt('return', false);

              case 4:

                debug('Retrieving team', { teamId: teamId });
                _context3.next = 7;
                return _this.getTeam(teamId);

              case 7:
                team = _context3.sent;
                _context3.next = 10;
                return _this.middleware.spawn.run({ team: team });

              case 10:

                debug('Creating bot', { team: team });
                bot = new _Bot2.default({
                  team: team,
                  logger: _this.logger,
                  receive: _this.middleware.receive,
                  send: _this.middleware.send,
                  sent: _this.middleware.sent
                });

                _this.bots[teamId] = bot;

                debug('Starting bot', { bot: bot });
                bot.start();
                bot.on(_Bot.DISCONNECT, function () {
                  debug('Bot disconnected', { teamId: teamId });
                  delete _this.bots[teamId];
                });

                debug('Bot started', { teamId: teamId });
                return _context3.abrupt('return', bot);

              case 18:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, _this);
      }));
      return function (_x) {
        return ref.apply(this, arguments);
      };
    }();

    this.config = config;

    var redisConfig = config.redis;
    var logger = config.logger;
    var queue = config.queue;
    var getTeam = config.getTeam;
    var solo = config.solo;
    // TODO add invariant

    this.queue = queue;
    this.getTeam = getTeam;
    this.redis = _redis2.default.createClient(redisConfig);
    this.bots = {};
    this.solo = solo !== undefined ? solo : false;
    this.logger = (typeof logger === 'undefined' ? 'undefined' : (0, _typeof3.default)(logger)) === 'object' ? logger : console;
    this.middleware = {
      spawn: new _Middleware2.default('spawn'),
      receive: new _Middleware2.default('receive'),
      send: new _Middleware2.default('send'),
      sent: new _Middleware2.default('sent')
    };
  }

  (0, _createClass3.default)(Controller, [{
    key: 'getBot',
    value: function getBot(teamId) {
      return this.bots[teamId];
    }
  }]);
  return Controller;
}();

exports.default = Controller;