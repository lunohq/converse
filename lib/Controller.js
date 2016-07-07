'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _Bot = require('./Bot');

var _Bot2 = _interopRequireDefault(_Bot);

var _Context = require('./Context');

var _Context2 = _interopRequireDefault(_Context);

var _Middleware = require('./Middleware');

var _Middleware2 = _interopRequireDefault(_Middleware);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('converse:Controller');

var Controller = function () {
  function Controller(config) {
    var _this = this;

    (0, _classCallCheck3.default)(this, Controller);
    this.start = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }));

    this.spawn = function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(teamId) {
        var _ret, team, ctx, bot;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                debug('Spawning bot for team', { teamId: teamId });

                if (!(_this.bots[teamId] !== undefined)) {
                  _context2.next = 5;
                  break;
                }

                _ret = function () {
                  var bot = _this.bots[teamId];
                  return {
                    v: new _promise2.default(function (resolve, reject) {
                      if (bot.connected) {
                        debug('Team already connected', { teamId: teamId });
                        resolve(bot);
                        return;
                      }

                      debug('Team connecting', { teamId: teamId });
                      bot.once(_Bot.CONNECTED, function () {
                        debug('Team finished connecting', { teamId: teamId });
                        resolve(bot);
                      });
                      bot.once(_Bot.DISCONNECT, function (err) {
                        debug('Can\'t connect team', { teamId: teamId });
                        reject(err);
                      });
                    })
                  };
                }();

                if (!((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object")) {
                  _context2.next = 5;
                  break;
                }

                return _context2.abrupt('return', _ret.v);

              case 5:

                debug('Retrieving team', { teamId: teamId });
                _context2.next = 8;
                return _this.getTeam(teamId);

              case 8:
                team = _context2.sent;
                ctx = new _Context2.default({ logger: _this.logger, team: team });
                _context2.next = 12;
                return _this.middleware.spawn.run({ ctx: ctx, team: team });

              case 12:

                debug('Creating bot', { team: team });
                bot = new _Bot2.default({
                  team: team,
                  logger: _this.logger,
                  receive: _this.middleware.receive,
                  send: _this.middleware.send,
                  sent: _this.middleware.sent
                });

                _this.bots[teamId] = bot;

                debug('Starting bot', { teamId: teamId });
                bot.start();

                bot.on(_Bot.WS_ERROR, function (err) {
                  _this.logger.error('Bot websocket error', { teamId: teamId, err: err });
                });
                return _context2.abrupt('return', new _promise2.default(function (resolve, reject) {
                  bot.on(_Bot.CONNECTED, function () {
                    debug('Bot started', { teamId: teamId });
                    resolve(bot);
                  });
                  bot.on(_Bot.DISCONNECT, function (err, code) {
                    _this.logger.info('Bot disconnected', { teamId: teamId, err: err, code: code });
                    if (code === 'account_inactive') {
                      _this.handleInactive(teamId);
                    }
                    delete _this.bots[teamId];
                    reject(err, code);
                  });
                }));

              case 19:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, _this);
      }));
      return function (_x) {
        return ref.apply(this, arguments);
      };
    }();

    this.config = config;

    var logger = config.logger;
    var getTeam = config.getTeam;
    var onInactive = config.onInactive;
    // TODO add invariant

    this.getTeam = getTeam;
    this.handleInactive = typeof onInactive === 'function' ? onInactive : function () {};
    this.bots = {};
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