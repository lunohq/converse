"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A Message sent to a channel by a Producer and consumed by a Consumer.
 *
 * Message should:
 *
 * - contain context about a message
 */

var Message = function Message() {
  (0, _classCallCheck3.default)(this, Message);
};

exports.default = Message;