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
    value: function getAuthorizeURL(_ref) {
      var scopes = _ref.scopes;
      var state = _ref.state;
      var teamId = _ref.teamId;

      var url = SLACK_AUTHORIZE_ENDPOINT + '?client_id=' + this.clientId + '&scope=' + scopes.join(',') + '&team=' + teamId;
      if (state) {
        url = url + '&state=' + (0, _cookieSignature.sign)(state, this.clientSecret);
      }
      return url;
    }
  }, {
    key: 'getLoginURL',
    value: function getLoginURL(teamId) {
      return this.getAuthorizeURL({ scopes: this.scopes.login, state: 'login', teamId: teamId });
    }
  }, {
    key: 'getInstallURL',
    value: function getInstallURL(teamId) {
      return this.getAuthorizeURL({ scopes: this.scopes.install, state: 'install', teamId: teamId });
    }
  }, {
    key: 'createAuthEndpoints',

    /*eslint-enable no-param-reassign*/
    value: function createAuthEndpoints(app, cb) {
      var _this2 = this;

      if (this.scopes.login) {
        this.logger.info('Configuring /login endpoint');
        app.get('/login', function (req, res) {
          res.redirect(_this2.getLoginURL());
        });
      }

      if (this.scopes.install) {
        this.logger.info('Configuring /install endpoint');
        app.get('/install', function (req, res) {
          res.redirect(_this2.getInstallURL());
        });
      }

      this.logger.info('Configuring /oauth endpoint');
      app.get('/oauth', function () {
        var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(req, res) {
          var _res$locals, auth, user, team, isNew;

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
                  isNew = _res$locals.isNew;

                  _this2.emit('authenticated', { auth: auth, user: user, team: team, isNew: isNew });

                case 18:
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
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              return _context2.abrupt('return', auth);

            case 1:
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
      var api, details;
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              api = new _client.WebClient(auth.access_token);
              _context3.next = 3;
              return api.auth.test();

            case 3:
              details = _context3.sent;

              debug('Install User Details', details);
              return _context3.abrupt('return', {
                team: {
                  id: details.team_id,
                  name: details.team
                },
                user: {
                  id: details.user_id,
                  name: details.user
                }
              });

            case 6:
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
      var _req$query, code, signedState, state, api, auth, userDetails, _userDetails, _userDetails$user, userId, userEmail, userName, _userDetails$team, teamId, teamName, teamDomain, isNew, team, scopes, user;

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

              state = (0, _cookieSignature.unsign)(signedState, _this3.clientSecret);

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
              _context4.next = _context4.t0 === 'login' ? 16 : 21;
              break;

            case 16:
              debug('Fetching login user details', { state: state });
              _context4.next = 19;
              return _this3.getLoginUserDetails(auth);

            case 19:
              userDetails = _context4.sent;
              return _context4.abrupt('break', 25);

            case 21:
              debug('Fetching install user details', { state: state });
              _context4.next = 24;
              return _this3.getInstallUserDetails(auth);

            case 24:
              userDetails = _context4.sent;

            case 25:

              debug('OAuth User Details', userDetails);
              _userDetails = userDetails;
              _userDetails$user = _userDetails.user;
              userId = _userDetails$user.id;
              userEmail = _userDetails$user.email;
              userName = _userDetails$user.name;
              _userDetails$team = _userDetails.team;
              teamId = _userDetails$team.id;
              teamName = _userDetails$team.name;
              teamDomain = _userDetails$team.domain;
              isNew = {
                team: false,
                user: false,
                bot: false
              };
              _context4.next = 38;
              return _this3.storage.teams.get(teamId);

            case 38:
              team = _context4.sent;

              if (!team) {
                isNew.team = true;
                team = {
                  id: teamId,
                  createdBy: userId
                };
                if (teamName) {
                  team.name = teamName;
                }
                if (teamDomain) {
                  team.domain = teamDomain;
                }
              }

              if (!team.bot && auth.bot) {
                isNew.bot = true;
                team.bot = {
                  accessToken: auth.bot.bot_access_token,
                  userId: auth.bot.bot_user_id,
                  createdBy: userId
                };
                _this3.emit('create_bot', team);
              }
              if (team.bot && auth.bot && team.bot.accessToken !== auth.bot.bot_access_token) {
                team.bot.accessToken = auth.bot.access_token;
              }
              if (team.bot && auth.bot && team.bot.userId !== auth.bot.bot_user_id) {
                team.bot.userId = auth.bot.bot_user_id;
              }

              debug('Saving team', { team: team, isNew: isNew.team });
              _context4.next = 46;
              return _this3.storage.teams.save({ team: team, isNew: isNew.team });

            case 46:
              team = _context4.sent;

              if (isNew.team) {
                _this3.emit('create_team', team);
              } else {
                _this3.emit('update_team', team);
              }

              scopes = auth.scope.split(',');
              _context4.next = 51;
              return _this3.storage.users.get(userId);

            case 51:
              user = _context4.sent;

              if (!user) {
                isNew.user = true;
                user = {
                  id: userId,
                  teamId: teamId
                };
                if (userEmail) {
                  user.email = userEmail;
                }
                if (userName) {
                  user.user = userName;
                }
              }
              user.accessToken = auth.access_token;
              user.scopes = scopes;

              debug('Saving user', { user: user, isNew: isNew.user });
              _context4.next = 58;
              return _this3.storage.users.save({ user: user, isNew: isNew.user });

            case 58:
              user = _context4.sent;

              if (isNew.user) {
                _this3.emit('create_user', user);
              } else {
                _this3.emit('update_user', user);
              }

              /*eslint-disable no-param-reassign*/
              res.locals.auth = auth;
              res.locals.user = user;
              res.locals.team = team;
              res.locals.isNew = isNew;
            case 64:
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