'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _values = require('babel-runtime/core-js/object/values');

var _values2 = _interopRequireDefault(_values);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _client = require('@slack/client');

var _Context = require('./Context');

var _Context2 = _interopRequireDefault(_Context);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('converse:bot');

function _send(_ref) {
  var ctx = _ref.ctx;
  var message = _ref.message;

  if (ctx.send === false) return;

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
    if (!bot.config.token) {
      throw new Error('No token for web api');
    }
    return bot.api.chat.postMessage(payload.channel, payload.text, payload);
  } else {
    return bot.rtm.send(payload);
  }
}

var Bot = function () {
  function Bot(config) {
    (0, _classCallCheck3.default)(this, Bot);

    this.config = config;

    var team = config.team;
    var receive = config.receive;
    var send = config.send;
    // TODO Add invariant checks for the structure of team we expect

    this.config.token = team.token;
    this.team = team;
    this.config = config !== undefined ? config : {};

    this.rtm = new _client.RtmClient(this.team.token, config.rtm);
    this.api = new _client.WebClient(this.team.token);
    this.middleware = {
      receive: receive,
      send: send
    };
  }

  (0, _createClass3.default)(Bot, [{
    key: 'createContext',
    value: function createContext() {
      return new _Context2.default({ team: this.team, bot: this });
    }
  }, {
    key: 'start',
    value: function start() {
      var _this = this;

      debug('Starting bot', { team: this.team });
      this.rtm.start();
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)((0, _values2.default)(_client.RTM_EVENTS)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var event = _step.value;

          this.rtm.on(event, function (message) {
            return _this.receive(message);
          });
        }

        // TODO emit events for when the bot gets disconnected so the controller can
        // remove it from its list of connected clients
        // https://github.com/slackhq/node-slack-client/blob/master/lib/clients/events/client.js#L26
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
    }
  }, {
    key: 'receive',
    value: function receive(message) {
      debug('Bot.receive', { team: this.team, message: message });
      var ctx = this.createContext();
      this.middleware.receive.run({ ctx: ctx, message: message });
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
      debug('Bot.reply', { team: this.team, message: message, source: source, response: response });
      return this.send(message);
    }
  }, {
    key: 'startTyping',
    value: function startTyping(source) {
      return this.reply(source, { type: 'typing' });
    }
  }, {
    key: 'send',
    value: function send(message) {
      debug('Bot send', { team: this.team, message: message });
      var ctx = this.createContext();
      return this.middleware.send.run({ ctx: ctx, message: message }).then(function () {
        return _send({ ctx: ctx, message: message });
      });
    }
  }]);
  return Bot;
}();

exports.default = Bot;