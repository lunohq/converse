import EventEmitter from 'events'

import { sign, unsign } from './utils/crypto'
import { WebClient } from '@slack/client'

const debug = require('debug')('converse:Server')

const SLACK_AUTHORIZE_ENDPOINT = 'https://slack.com/oauth/authorize'

function defaultIsNewUser(user) {
  return !user
}

class Server extends EventEmitter {

  constructor(config) {
    super()
    const {
      clientId,
      clientSecret,
      storage,
      scopes,
      logger,
      isNewUser,
    } = config
    this.storage = storage
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.scopes = scopes
    this.logger = logger || console
    this.isNewUser = isNewUser || defaultIsNewUser
    this.validate()
  }

  validate() {
    if (!this.clientId) {
      throw new Error('"clientId" is required')
    }
    if (!this.clientSecret) {
      throw new Error('"clientSecret" is required')
    }
    this.validateScopes()
    this.validateStorage()
    this.validateLoginScopes()
  }

  validateScopes() {
    if (!this.scopes) {
      throw new Error('"scopes" is required')
    }

    if (!this.scopes.login) {
      throw new Error('"scopes.login" is required')
    }
    if (typeof this.scopes.login.join !== 'function') {
      throw new Error('"scopes.login" must have an array interface')
    }

    if (!this.scopes.install) {
      throw new Error('"scopes.install" is required')
    }
    if (typeof this.scopes.install.join !== 'function') {
      throw new Error('"scopes.install" must have an array interface')
    }
  }

  validateStorage() {
    if (!this.storage) {
      throw new Error('"storage" is required')
    }

    if (!this.storage.users) {
      throw new Error('"storage.users" is required')
    }
    if (typeof this.storage.users.get !== 'function') {
      throw new Error('"storage.users.get" must be a function')
    }
    if (typeof this.storage.users.save !== 'function') {
      throw new Error('"storage.users.save" must be a function')
    }

    if (!this.storage.teams) {
      throw new Error('"storage.teams" is required')
    }
    if (typeof this.storage.teams.get !== 'function') {
      throw new Error('"storage.teams.get" must be a function')
    }
    if (typeof this.storage.teams.save !== 'function') {
      throw new Error('"storage.teams.save" must be a function')
    }
  }

  validateLoginScopes() {
    if (this.scopes.login) {
      let valid = true
      for (const scope of this.scopes.login) {
        if (!scope.startsWith('identity')) {
          valid = false
          break
        }
      }
      if (!valid) {
        throw new Error('Invalid login scopes. Can only contain identity.* scopes.')
      }
    }
  }

  getAuthorizeURL({ scopes, state, teamId }) {
    let url = `${SLACK_AUTHORIZE_ENDPOINT}?client_id=${this.clientId}&scope=${scopes.join(',')}&team=${teamId}`
    if (state) {
      url = `${url}&state=${sign(state, this.clientSecret)}`
    }
    return url
  }

  getLoginURL(teamId) {
    return this.getAuthorizeURL({ scopes: this.scopes.login, state: 'login', teamId })
  }

  getInstallURL(teamId) {
    return this.getAuthorizeURL({ scopes: this.scopes.install, state: 'install', teamId })
  }

  getLoginAuthDetails = async (auth) => auth

  getInstallAuthDetails = async (auth) => {
    const api = new WebClient(auth.access_token)
    const details = await api.auth.test()
    debug('Install User Details', details)
    return {
      team: {
        id: details.team_id,
        name: details.team,
        url: details.url,
      },
      user: {
        id: details.user_id,
        user: details.user,
      },
    }
  }

  handleOAuthResponse = async (req, res) => {
    const { query: { code, state: signedState } } = req

    let state
    if (signedState) {
      state = unsign(signedState, this.clientSecret)
      if (state === false) {
        throw new Error('Invalid signature for state')
      }
    }

    const api = new WebClient()
    const auth = await api.oauth.access(this.clientId, this.clientSecret, code)

    let authDetails
    switch (state) {
      case 'login':
        debug('Fetching login auth details', { state })
        authDetails = await this.getLoginAuthDetails(auth)
        break
      default:
        debug('Fetching install auth details', { state })
        authDetails = await this.getInstallAuthDetails(auth)
    }

    debug('OAuth Details', authDetails)
    const { user: userDetails, team: teamDetails } = authDetails
    const isNew = {
      team: false,
      user: false,
      bot: false,
    }

    let team = await this.storage.teams.get(teamDetails.id)
    if (!team) {
      isNew.team = true
      const { id, ...rest } = teamDetails
      team = {
        id,
        createdBy: userDetails.id,
        ...rest,
      }
    }

    if (!team.bot && auth.bot) {
      isNew.bot = true
      team.bot = {
        accessToken: auth.bot.bot_access_token,
        userId: auth.bot.bot_user_id,
        createdBy: userDetails.id,
      }
      this.emit('create_bot', team)
    }
    debug('Checking for new token', { team, auth })
    if (team.bot && auth.bot && team.bot.accessToken !== auth.bot.bot_access_token) {
      team.bot.accessToken = auth.bot.bot_access_token
    }
    if (team.bot && auth.bot && team.bot.userId !== auth.bot.bot_user_id) {
      team.bot.userId = auth.bot.bot_user_id
    }

    debug('Saving team', { team, isNew: isNew.team })
    team = await this.storage.teams.save({ team, isNew: isNew.team })
    if (isNew.team) {
      this.emit('create_team', team)
    } else {
      this.emit('update_team', team)
    }

    const scopes = auth.scope.split(',')
    let user = await this.storage.users.get(userDetails.id)
    const isNewUser = await this.isNewUser(user)
    if (isNewUser) {
      isNew.user = true
      if (typeof user !== 'object') {
        user = { id: userDetails.id }
      }
      user.teamId = teamDetails.id
    }

    for (const key of Object.keys(userDetails)) {
      if (user[key] === undefined) {
        user[key] = userDetails[key]
      }
    }

    user.accessToken = auth.access_token
    user.scopes = scopes

    debug('Saving user', { user, isNew: isNew.user })
    user = await this.storage.users.save({ user, isNew: isNew.user })
    if (isNew.user) {
      this.emit('create_user', user)
    } else {
      this.emit('update_user', user)
    }

    /*eslint-disable no-param-reassign*/
    res.locals.auth = auth
    res.locals.user = user
    res.locals.team = team
    res.locals.isNew = isNew
    /*eslint-enable no-param-reassign*/
  }

  createAuthEndpoints(app, cb) {
    if (this.scopes.login) {
      this.logger.info('Configuring /login endpoint')
      app.get('/login', (req, res) => {
        res.redirect(this.getLoginURL())
      })
    }

    if (this.scopes.install) {
      this.logger.info('Configuring /install endpoint')
      app.get('/install', (req, res) => {
        res.redirect(this.getInstallURL())
      })
    }

    this.logger.info('Configuring /oauth endpoint')
    app.get('/oauth', async (req, res) => {
      try {
        await this.handleOAuthResponse(req, res)
      } catch (err) {
        this.logger.error('Error handing OAuth response', err)
        if (cb) {
          cb(err, req, res)
        } else {
          res.status(500).send(err)
        }
        this.emit('error', err)
        return
      }

      if (cb) {
        try {
          await cb(null, req, res)
        } catch (err) {
          cb(err, req, res)
        }
      } else {
        res.redirect('/')
      }

      const { locals: { auth, user, team, isNew } } = res
      this.emit('authenticated', { auth, user, team, isNew })
    })
  }

  createWebhookEndpoints(app) {
    this.logger.info('Configuring /slack/receive endpoint')
    app.post('/slack/receive', (req, res) => {
      if (req.body.command) {
        const message = {}
        for (const key of Object.keys(req.body)) {
          message[key] = req.body[key]
        }
        debug('Slack webhook received', { message })
        res.status(200)
      }
    })
  }

}

export default Server
