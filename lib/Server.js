'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

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

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _cookieSignature = require('cookie-signature');

var _client = require('@slack/client');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('converse:Server');

var SLACK_AUTHORIZE_ENDPOINT = 'https://slack.com/oauth/authorize';

var Server = function (_EventEmitter) {
  (0, _inherits3.default)(Server, _EventEmitter);

  function Server(config) {
    (0, _classCallCheck3.default)(this, Server);

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(Server).call(this));

    _initialiseProps.call(_this);

    var clientId = config.clientId;
    var clientSecret = config.clientSecret;
    var storage = config.storage;
    var scopes = config.scopes;
    var logger = config.logger;
    // TODO invariant checks

    _this.storage = storage;
    _this.clientId = clientId;
    _this.clientSecret = clientSecret;
    _this.scopes = scopes;
    _this.logger = logger;

    _this.validateLoginScopes();
    return _this;
  }

  (0, _createClass3.default)(Server, [{
    key: 'validateLoginScopes',
    value: function validateLoginScopes() {
      if (this.scopes.login) {
        var valid = true;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = (0, _getIterator3.default)(this.scopes.login), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var scope = _step.value;

            if (!scope.startsWith('identity')) {
              valid = false;
              break;
            }
          }
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

        if (!valid) {
          throw new Error('Invalid login scopes. Can only contain identity.* scopes.');
        }
      }
    }
  }, {
    key: 'getAuthorizeURL',
    value: function getAuthorizeURL(scopes, state) {
      var url = SLACK_AUTHORIZE_ENDPOINT + '?client_id=' + this.clientId + '&scope=' + scopes.join(',');
      if (state) {
        url = url + '&state=' + (0, _cookieSignature.sign)(state, this.clientSecret);
      }
      return url;
    }
  }, {
    key: 'getLoginURL',
    value: function getLoginURL() {
      return this.getAuthorizeURL(this.scopes.login, 'login');
    }
  }, {
    key: 'getInstallURL',
    value: function getInstallURL() {
      return this.getAuthorizeURL(this.scopes.install, 'install');
    }
  }, {
    key: 'createAuthEndpoints',

    /*eslint-enable no-param-reassign*/
    value: function createAuthEndpoints(app, cb) {
      var _this2 = this;

      if (this.scopes.login) {
        app.get('/login', function (req, res) {
          res.redirect(_this2.getLoginURL());
        });
      }

      if (this.scopes.install) {
        app.get('/install', function (req, res) {
          res.redirect(_this2.getInstallURL());
        });
      }

      app.get('/oauth', function () {
        var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(req, res) {
          var _res$locals, auth, user, team;

          return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.prev = 0;
                  _context.next = 3;
                  return _this2.handleOAuthResponse(req, res);

                case 3:
                  _context.next = 11;
                  break;

                case 5:
                  _context.prev = 5;
                  _context.t0 = _context['catch'](0);

                  _this2.logger.error('Error handing OAuth response', _context.t0);
                  if (cb) {
                    cb(_context.t0, req, res);
                  } else {
                    res.status(500).send(_context.t0);
                  }
                  _this2.emit('error', _context.t0);
                  return _context.abrupt('return');

                case 11:

                  if (cb) {
                    cb(null, req, res);
                  } else {
                    res.redirect('/');
                  }

                  _res$locals = res.locals;
                  auth = _res$locals.auth;
                  user = _res$locals.user;
                  team = _res$locals.team;

                  _this2.emit('authenticated', { auth: auth, user: user, team: team });

                case 17:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this2, [[0, 5]]);
        }));
        return function (_x, _x2) {
          return ref.apply(this, arguments);
        };
      }());
    }
  }]);
  return Server;
}(_events2.default);

var _initialiseProps = function _initialiseProps() {
  var _this3 = this;

  this.getLoginUserDetails = function () {
    var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(auth) {
      var userId, teamId;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              userId = auth.user.id;
              teamId = auth.team.id;
              return _context2.abrupt('return', { userId: userId, teamId: teamId });

            case 3:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this3);
    }));
    return function (_x3) {
      return ref.apply(this, arguments);
    };
  }();

  this.getInstallUserDetails = function () {
    var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(auth) {
      var api, _ref, teamId, userId;

      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              api = new _client.WebClient(auth.access_token);
              _context3.next = 3;
              return api.auth.test();

            case 3:
              _ref = _context3.sent;
              teamId = _ref.team_id;
              userId = _ref.user_id;
              return _context3.abrupt('return', { teamId: teamId, userId: userId });

            case 7:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, _this3);
    }));
    return function (_x4) {
      return ref.apply(this, arguments);
    };
  }();

  this.handleOAuthResponse = function () {
    var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(req, res) {
      var _req$query, code, signedState, state, api, auth, userDetails, _userDetails, userId, teamId, team, isNew, scopes, user;

      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _req$query = req.query;
              code = _req$query.code;
              signedState = _req$query.state;
              state = void 0;

              if (!signedState) {
                _context4.next = 8;
                break;
              }

              state = (0, _cookieSignature.unsign)(signedState);

              if (!(state === false)) {
                _context4.next = 8;
                break;
              }

              throw new Error('Invalid signature for state');

            case 8:
              api = new _client.WebClient();
              _context4.next = 11;
              return api.oauth.access(_this3.clientId, _this3.clientSecret, code);

            case 11:
              auth = _context4.sent;
              userDetails = void 0;
              _context4.t0 = state;
              _context4.next = _context4.t0 === 'login' ? 16 : 20;
              break;

            case 16:
              _context4.next = 18;
              return _this3.getLoginUserDetails(auth);

            case 18:
              userDetails = _context4.sent;
              return _context4.abrupt('break', 23);

            case 20:
              _context4.next = 22;
              return _this3.getInstallUserDetails(auth);

            case 22:
              userDetails = _context4.sent;

            case 23:
              debug('OAuth User Details', userDetails);
              _userDetails = userDetails;
              userId = _userDetails.userId;
              teamId = _userDetails.teamId;
              _context4.next = 29;
              return _this3.storage.teams.get(teamId);

            case 29:
              team = _context4.sent;
              isNew = false;

              if (!team) {
                isNew = true;
                team = {
                  id: teamId,
                  createdBy: userId
                };
              }

              if (auth.bot) {
                team.bot = {
                  token: auth.bot.bot_access_token,
                  userId: auth.bot.bot_user_id,
                  createdBy: userId
                };
                _this3.emit('create_bot', team);
              }

              _context4.next = 35;
              return _this3.storage.teams.save({ team: team, isNew: isNew });

            case 35:
              team = _context4.sent;

              if (isNew) {
                _this3.emit('create_team', team);
              } else {
                _this3.emit('update_team', team);
              }

              scopes = auth.scope.split(',');
              _context4.next = 40;
              return _this3.storage.users.get(userId);

            case 40:
              user = _context4.sent;

              isNew = false;
              if (!user) {
                isNew = true;
                user = {
                  id: userId,
                  teamId: teamId
                };
              }
              user.accessToken = auth.access_token;
              user.scopes = scopes;

              _context4.next = 47;
              return _this3.storage.users.save({ user: user, isNew: isNew });

            case 47:
              user = _context4.sent;

              if (isNew) {
                _this3.emit('create_user', user);
              } else {
                _this3.emit('update_user', user);
              }

              /*eslint-disable no-param-reassign*/
              res.locals.auth = auth;
              res.locals.user = user;
              res.locals.team = team;
            case 52:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, _this3);
    }));
    return function (_x5, _x6) {
      return ref.apply(this, arguments);
    };
  }();
};

exports.default = Server;