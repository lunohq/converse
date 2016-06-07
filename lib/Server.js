'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

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

var _crypto = require('./utils/crypto');

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

    _this.storage = storage;
    _this.clientId = clientId;
    _this.clientSecret = clientSecret;
    _this.scopes = scopes;
    _this.logger = logger || console;

    _this.validate();
    return _this;
  }

  (0, _createClass3.default)(Server, [{
    key: 'validate',
    value: function validate() {
      if (!this.clientId) {
        throw new Error('"clientId" is required');
      }
      if (!this.clientSecret) {
        throw new Error('"clientSecret" is required');
      }
      this.validateScopes();
      this.validateStorage();
      this.validateLoginScopes();
    }
  }, {
    key: 'validateScopes',
    value: function validateScopes() {
      if (!this.scopes) {
        throw new Error('"scopes" is required');
      }

      if (!this.scopes.login) {
        throw new Error('"scopes.login" is required');
      }
      if (typeof this.scopes.login.join !== 'function') {
        throw new Error('"scopes.login" must have an array interface');
      }

      if (!this.scopes.install) {
        throw new Error('"scopes.install" is required');
      }
      if (typeof this.scopes.install.join !== 'function') {
        throw new Error('"scopes.install" must have an array interface');
      }
    }
  }, {
    key: 'validateStorage',
    value: function validateStorage() {
      if (!this.storage) {
        throw new Error('"storage" is required');
      }

      if (!this.storage.users) {
        throw new Error('"storage.users" is required');
      }
      if (typeof this.storage.users.get !== 'function') {
        throw new Error('"storage.users.get" must be a function');
      }
      if (typeof this.storage.users.save !== 'function') {
        throw new Error('"storage.users.save" must be a function');
      }

      if (!this.storage.teams) {
        throw new Error('"storage.teams" is required');
      }
      if (typeof this.storage.teams.get !== 'function') {
        throw new Error('"storage.teams.get" must be a function');
      }
      if (typeof this.storage.teams.save !== 'function') {
        throw new Error('"storage.teams.save" must be a function');
      }
    }
  }, {
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
        url = url + '&state=' + (0, _crypto.sign)(state, this.clientSecret);
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
  }, {
    key: 'createWebhookEndpoints',
    value: function createWebhookEndpoints(app) {
      this.logger.info('Configuring /slack/receive endpoint');
      app.post('/slack/receive', function (req, res) {
        if (req.body.command) {
          var message = {};
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = (0, _getIterator3.default)((0, _keys2.default)(req.body)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var key = _step2.value;

              message[key] = req.body[key];
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }

          debug('Slack webhook received', { message: message });
          res.status(200);
        }
      });
    }
  }]);
  return Server;
}(_events2.default);

var _initialiseProps = function _initialiseProps() {
  var _this3 = this;

  this.getLoginAuthDetails = function () {
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

  this.getInstallAuthDetails = function () {
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
      var _req$query, code, signedState, state, api, auth, authDetails, _authDetails, userDetails, teamDetails, isNew, team, id, rest, scopes, user, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, key;

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

              state = (0, _crypto.unsign)(signedState, _this3.clientSecret);

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
              authDetails = void 0;
              _context4.t0 = state;
              _context4.next = _context4.t0 === 'login' ? 16 : 21;
              break;

            case 16:
              debug('Fetching login auth details', { state: state });
              _context4.next = 19;
              return _this3.getLoginAuthDetails(auth);

            case 19:
              authDetails = _context4.sent;
              return _context4.abrupt('break', 25);

            case 21:
              debug('Fetching install auth details', { state: state });
              _context4.next = 24;
              return _this3.getInstallAuthDetails(auth);

            case 24:
              authDetails = _context4.sent;

            case 25:

              debug('OAuth Details', authDetails);
              _authDetails = authDetails;
              userDetails = _authDetails.user;
              teamDetails = _authDetails.team;
              isNew = {
                team: false,
                user: false,
                bot: false
              };
              _context4.next = 32;
              return _this3.storage.teams.get(teamDetails.id);

            case 32:
              team = _context4.sent;

              if (!team) {
                isNew.team = true;
                id = teamDetails.id;
                rest = (0, _objectWithoutProperties3.default)(teamDetails, ['id']);

                team = (0, _extends3.default)({
                  id: id,
                  createdBy: userDetails.id
                }, rest);
              }

              if (!team.bot && auth.bot) {
                isNew.bot = true;
                team.bot = {
                  accessToken: auth.bot.bot_access_token,
                  userId: auth.bot.bot_user_id,
                  createdBy: userDetails.id
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
              _context4.next = 40;
              return _this3.storage.teams.save({ team: team, isNew: isNew.team });

            case 40:
              team = _context4.sent;

              if (isNew.team) {
                _this3.emit('create_team', team);
              } else {
                _this3.emit('update_team', team);
              }

              scopes = auth.scope.split(',');
              _context4.next = 45;
              return _this3.storage.users.get(userDetails.id);

            case 45:
              user = _context4.sent;

              if (!user) {
                isNew.user = true;
                user = {
                  id: userDetails.id,
                  teamId: teamDetails.id
                };
              }

              _iteratorNormalCompletion3 = true;
              _didIteratorError3 = false;
              _iteratorError3 = undefined;
              _context4.prev = 50;
              for (_iterator3 = (0, _getIterator3.default)((0, _keys2.default)(userDetails)); !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                key = _step3.value;

                if (user[key] === undefined) {
                  user[key] = userDetails[key];
                }
              }

              _context4.next = 58;
              break;

            case 54:
              _context4.prev = 54;
              _context4.t1 = _context4['catch'](50);
              _didIteratorError3 = true;
              _iteratorError3 = _context4.t1;

            case 58:
              _context4.prev = 58;
              _context4.prev = 59;

              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }

            case 61:
              _context4.prev = 61;

              if (!_didIteratorError3) {
                _context4.next = 64;
                break;
              }

              throw _iteratorError3;

            case 64:
              return _context4.finish(61);

            case 65:
              return _context4.finish(58);

            case 66:
              user.accessToken = auth.access_token;
              user.scopes = scopes;

              debug('Saving user', { user: user, isNew: isNew.user });
              _context4.next = 71;
              return _this3.storage.users.save({ user: user, isNew: isNew.user });

            case 71:
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
            case 77:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, _this3, [[50, 54, 58, 66], [59,, 61, 65]]);
    }));
    return function (_x5, _x6) {
      return ref.apply(this, arguments);
    };
  }();
};

exports.default = Server;