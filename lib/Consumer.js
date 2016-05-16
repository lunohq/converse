"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A Consumer will connect to request channels and consume messages.
 *
 * Consumer should:
 *
 * - subscribe to request channel
 * - on requests, attempt to retrieve a lock for the thread
 * - if lock succeeds, execute middleware
 * - if any messages have queued up in the channel, continue processing them
 *
 */

var Consumer = function Consumer() {
  (0, _classCallCheck3.default)(this, Consumer);
};

exports.default = Consumer;