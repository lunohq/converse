'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

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

// for PONG events, write to a hash of converse:pong:<team_id>: <connection id>: <last timestamp>, this will let us show that the bot is currently connected.
//
// these should expire after a certain amount of time.
//
//
// this will also let watchdog ensure that we always have two connections open.

var Controller = function Controller(_ref) {
  var _this = this;

  var config = _ref.config;
  var queue = _ref.queue;
  var getTeam = _ref.getTeam;
  var solo = _ref.solo;
  (0, _classCallCheck3.default)(this, Controller);
  this.start = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return _this.listen();

          case 3:
            _context.next = 8;
            break;

          case 5:
            _context.prev = 5;
            _context.t0 = _context['catch'](0);
            throw _context.t0;

          case 8:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this, [[0, 5]]);
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
            _context2.next = 15;
            return _this.listen();

          case 15:
            return _context2.abrupt('return', _context2.sent);

          case 16:
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

              debug('Creating bot', { team: team });
              bot = new _Bot2.default({
                team: team,
                config: _this.config,
                receive: _this.receive,
                send: _this.send
              });

              _this.bots[teamId] = bot;
              debug('Starting bot', { bot: bot });
              bot.start();
              debug('Bot started', { teamId: teamId });
              return _context3.abrupt('return', true);

            case 15:
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

  // TODO add invariant
  this.queue = queue;
  this.getTeam = getTeam;
  // TODO pass in options
  this.redis = _redis2.default.createClient();
  this.bots = {};
  this.solo = solo !== undefined ? solo : false;
  this.receive = new _Middleware2.default();
  this.send = new _Middleware2.default();
  this.config = config !== undefined ? config : {};
};

exports.default = Controller;