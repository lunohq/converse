'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('contrib:middleware:receive:events');

function replaceDirectMention(mention, text) {
  return text.replace(mention, '').replace(/^\s+/, '').replace(/^:\s+/, '').replace(/^\s+/, '');
}

/*eslint-disable no-param-reassign*/

exports.default = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(_ref) {
    var ctx = _ref.ctx;
    var message = _ref.message;
    var next = _ref.next;
    var identities, botId, directMention, mention;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            identities = ctx.identities;

            if (identities) {
              _context.next = 4;
              break;
            }

            debug('Not running, requires `identities` on context');
            return _context.abrupt('return', next());

          case 4:
            botId = identities.bot.id;
            directMention = new RegExp('^<@' + botId + '>', 'i');

            if (message.type === 'message') {
              if (message.text) {
                message.text = message.text.trim();
              }

              if (message.subtype === 'channel_join') {
                if (message.user === botId) {
                  message.event = 'bot_channel_join';
                } else {
                  message.event = 'user_channel_join';
                }
              } else if (message.subtype === 'group_join') {
                if (message.user === botId) {
                  message.event = 'bot_group_join';
                } else {
                  message.event = 'user_group_join';
                }
              } else if (message.user === botId) {
                message.event = 'self';
              } else if (message.channel.match(/^D/)) {
                message.text = replaceDirectMention(directMention, message.text);
                message.event = 'direct_message';
              } else if (message.subtype === 'bot_message') {
                message.event = 'bot_message';
              } else {
                mention = new RegExp('<@' + botId + '>', 'i');

                if (message.text.match(directMention)) {
                  message.text = replaceDirectMention(directMention, message.text);
                  message.event = 'direct_mention';
                } else if (message.text.match(mention)) {
                  message.event = 'mention';
                } else {
                  message.event = 'ambient';
                }
              }
            } else if (message.type === 'reaction_added') {
              if (message.user === botId) {
                message.event = 'self';
              }
            }
            return _context.abrupt('return', next());

          case 8:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  function events(_x) {
    return ref.apply(this, arguments);
  }

  return events;
}();
/*eslint-enable no-param-reassign*/