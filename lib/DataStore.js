'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

var _get2 = require('babel-runtime/helpers/get');

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _client = require('@slack/client');

var _slackRedisDataStore = require('slack-redis-data-store');

var _slackRedisDataStore2 = _interopRequireDefault(_slackRedisDataStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DataStore = function (_MemoryDataStore) {
  (0, _inherits3.default)(DataStore, _MemoryDataStore);

  function DataStore() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    (0, _classCallCheck3.default)(this, DataStore);

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(DataStore).call(this, opts));

    var redisDataStoreOpts = opts.redisDataStoreOpts;

    if (opts.team) {
      redisDataStoreOpts = (0, _extends3.default)({ keyPrefix: 's.cache.' + opts.team.id + '.' }, redisDataStoreOpts);
    }
    _this.redisDataStore = new _slackRedisDataStore2.default(redisDataStoreOpts);
    // sync the redis data store with the in memory data store every 30 seconds
    setInterval(function () {
      _this.redisDataStore.cacheData({
        users: _this.users,
        channels: _this.channels,
        dms: _this.dms,
        groups: _this.groups,
        bots: _this.bots,
        teams: _this.teams
      });
    }, 1000 * 30);
    return _this;
  }

  (0, _createClass3.default)(DataStore, [{
    key: 'cacheRtmStart',
    value: function cacheRtmStart(data) {
      (0, _get3.default)((0, _getPrototypeOf2.default)(DataStore.prototype), 'cacheRtmStart', this).call(this, data);
      this.redisDataStore.cacheRtmStart(data);
    }
  }]);
  return DataStore;
}(_client.MemoryDataStore);

exports.default = DataStore;