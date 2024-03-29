'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HEALTHY = exports.WS_ERROR = exports.WS_CLOSE = exports.CONNECTED = exports.DISCONNECT = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _values = require('babel-runtime/core-js/object/values');

var _values2 = _interopRequireDefault(_values);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _client = require('@slack/client');

var _slackRedisDataStore = require('slack-redis-data-store');

var _slackRedisDataStore2 = _interopRequireDefault(_slackRedisDataStore);

var _Context = require('./Context');

var _Context2 = _interopRequireDefault(_Context);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('converse:Bot');

var DISCONNECT = exports.DISCONNECT = _client.CLIENT_EVENTS.RTM.DISCONNECT;
var CONNECTED = exports.CONNECTED = _client.CLIENT_EVENTS.RTM_CONNECTION_OPENED;
var WS_CLOSE = exports.WS_CLOSE = _client.CLIENT_EVENTS.RTM.WS_CLOSE;
var WS_ERROR = exports.WS_ERROR = _client.CLIENT_EVENTS.RTM.WS_ERROR;
var HEALTHY = exports.HEALTHY = 'healthy';

function send(_ref) {
  var ctx = _ref.ctx;
  var message = _ref.message;

  if (ctx.send === false) {
    debug('Dropping message');
    return null;
  }

  var bot = ctx.bot;

  var payload = {
    type: message.type || 'message',
    channel: message.channel,
    text: message.text || null,
    username: message.username || null,
    parse: message.parse || null,
    link_names: message.link_names || null,
    attachments: message.attachments ? (0, _stringify2.default)(message.attachments) : null,
    unfurl_links: message.unfurl_links !== undefined ? message.unfurl_links : null,
    unfurl_media: message.unfurl_media !== undefined ? message.unfurl_media : null,
    icon_url: message.icon_url || null,
    icon_emoji: message.icon_emoji || null
  };

  if (message.icon_url || message.icon_emoji || message.username) {
    payload.as_user = false;
  } else {
    payload.as_user = message.as_user || true;
  }

  var requiresWeb = payload.attachments || !payload.as_user;
  if (requiresWeb) {
    debug('Sending message via web api', { payload: payload });
    return bot.api.chat.postMessage(payload.channel, payload.text, payload);
  }

  debug('Sending message via rtm', { payload: payload });
  return bot.rtm.send(payload);
}

var Bot = function (_Emitter) {
  (0, _inherits3.default)(Bot, _Emitter);

  function Bot() {
    var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    (0, _classCallCheck3.default)(this, Bot);

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(Bot).call(this));

    _initialiseProps.call(_this);

    _this.config = config;
    _this.connected = false;

    var logger = config.logger;
    var team = config.team;
    var receive = config.receive;
    var send = config.send;
    var sent = config.sent;
    // TODO Add invariant checks for the structure of team we expect

    _this.config.token = team.token;
    _this.team = team;
    _this.logger = logger;
    _this.identity = {};

    var rtmConfig = void 0;
    if (config.rtm === undefined) {
      var opts = (0, _extends3.default)({
        keyPrefix: 's.cache.' + team.id + '.'
      }, config.dataStoreOpts);
      rtmConfig = {
        dataStore: new _slackRedisDataStore2.default(opts),
        autoReconnect: true
      };
    } else {
      rtmConfig = config.rtm;
    }

    _this.rtm = new _client.RtmClient(_this.team.token, rtmConfig);
    _this.api = new _client.WebClient(_this.team.token);
    _this.middleware = {
      receive: receive,
      send: send,
      sent: sent
    };
    return _this;
  }

  (0, _createClass3.default)(Bot, [{
    key: 'createContext',
    value: function createContext(opts) {
      return new _Context2.default((0, _extends3.default)({ logger: this.logger, team: this.team, bot: this }, opts));
    }
  }, {
    key: 'start',
    value: function start() {
      var _this2 = this;

      debug('Starting bot', { team: this.team });
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)((0, _values2.default)(_client.RTM_EVENTS)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var event = _step.value;

          this.rtm.on(event, function (message) {
            return _this2.receive(message);
          });
        }

        // Emit messages related to the lifecylce of the connection
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

      this.rtm.on(_client.CLIENT_EVENTS.RTM.DISCONNECT, function (err, code) {
        _this2.connected = false;
        _this2.emit(DISCONNECT, err, code);
      });
      this.rtm.on(_client.CLIENT_EVENTS.RTM.WS_ERROR, function (err) {
        _this2.connected = false;
        _this2.emit(WS_ERROR, err);
      });
      this.rtm.on(_client.CLIENT_EVENTS.RTM.WS_CLOSE, function (code, reason) {
        _this2.connected = false;
        _this2.emit(WS_CLOSE, code, reason);
      });
      this.rtm.on(_client.CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                debug('Fetching identity', { userId: _this2.rtm.activeUserId });
                _context.prev = 1;
                _context.next = 4;
                return _this2.rtm.dataStore.getUserById(_this2.rtm.activeUserId);

              case 4:
                _this2.identity = _context.sent;
                _context.next = 10;
                break;

              case 7:
                _context.prev = 7;
                _context.t0 = _context['catch'](1);

                _this2.logger.error('Error fetching identity', { userId: _this2.rtm.activeUserId });

              case 10:
                if (!_this2.identity) {
                  _this2.logger.warning('Failed to find identity', { userId: _this2.rtm.activeUserId });
                } else {
                  debug('Attached identity', { identity: _this2.identity });
                }
                _this2.connected = true;
                _this2.emit(CONNECTED);

              case 13:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, _this2, [[1, 7]]);
      })));
      this.rtm.on(_client.CLIENT_EVENTS.RTM.PONG, function () {
        return _this2.emit(HEALTHY);
      });
      this.rtm.start();
    }
  }, {
    key: 'receive',
    value: function receive(message) {
      debug('Received message', { team: this.team, message: message });
      var ctx = this.createContext({ message: message });
      return this.middleware.receive.run({ ctx: ctx, message: message });
    }
  }, {
    key: 'reply',
    value: function reply(source, response) {
      var message = {};
      if (typeof response === 'string') {
        message.text = response;
      } else {
        message = response;
      }

      message.channel = source.channel;
      debug('Reply', { team: this.team, message: message, source: source, response: response });
      return this.send(source, message);
    }
  }, {
    key: 'replyWithTyping',
    value: function replyWithTyping(source, response) {
      this.startTyping(source);
      return this.reply(source, response);
    }
  }, {
    key: 'startTyping',
    value: function startTyping(source) {
      this.reply(source, { type: 'typing' });
    }
  }]);
  return Bot;
}(_events2.default);

var _initialiseProps = function _initialiseProps() {
  var _this3 = this;

  this.send = function () {
    var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(source, message) {
      var ctx, response;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              debug('Send', { team: _this3.team, message: message, source: source });
              ctx = _this3.createContext({ message: message });
              _context2.next = 4;
              return _this3.middleware.send.run({ ctx: ctx, message: message, source: source });

            case 4:
              _context2.next = 6;
              return send({ ctx: ctx, message: message });

            case 6:
              response = _context2.sent;

              debug('Sent', { response: response });

              if (!(response !== null)) {
                _context2.next = 10;
                break;
              }

              return _context2.abrupt('return', _this3.middleware.sent.run({ ctx: ctx, message: message, source: source, response: response }).then(function () {
                return _promise2.default.resolve(response);
              }));

            case 10:
              return _context2.abrupt('return', _promise2.default.resolve());

            case 11:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this3);
    }));
    return function (_x2, _x3) {
      return ref.apply(this, arguments);
    };
  }();
};

exports.default = Bot;