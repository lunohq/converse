import EventEmitter from 'events'

import { sign, unsign } from 'cookie-signature'
import { WebClient } from '@slack/client'

const debug = require('debug')('converse:Server')

const SLACK_AUTHORIZE_ENDPOINT = 'https://slack.com/oauth/authorize'

class Server extends EventEmitter {

  constructor(config) {
    super()
    const { clientId, clientSecret, storage, scopes, logger } = config
    // TODO invariant checks
    this.storage = storage
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.scopes = scopes
    this.logger = logger

    this.validateLoginScopes()
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

  getAuthorizeURL(scopes, state) {
    let url = `${SLACK_AUTHORIZE_ENDPOINT}?client_id=${this.clientId}&scope=${scopes.join(',')}`
    if (state) {
      url = `${url}&state=${sign(state, this.clientSecret)}`
    }
    return url
  }

  getLoginURL() {
    return this.getAuthorizeURL(this.scopes.login, 'login')
  }

  getInstallURL() {
    return this.getAuthorizeURL(this.scopes.install, 'install')
  }

  getLoginUserDetails = async (auth) => {
    const { user: { id: userId }, team: { id: teamId } } = auth
    return { userId, teamId }
  }

  getInstallUserDetails = async (auth) => {
    const api = new WebClient(auth.access_token)
    const { team_id: teamId, user_id: userId } = await api.auth.test()
    return { teamId, userId }
  }

  handleOAuthResponse = async (req, res) => {
    const { query: { code, state: signedState } } = req

    let state
    if (signedState) {
      state = unsign(signedState)
      if (state === false) {
        throw new Error('Invalid signature for state')
      }
    }

    const api = new WebClient()
    const auth = await api.oauth.access(this.clientId, this.clientSecret, code)

    let userDetails
    switch (state) {
      case 'login':
        userDetails = await this.getLoginUserDetails(auth)
        break
      default:
        userDetails = await this.getInstallUserDetails(auth)
    }
    debug('OAuth User Details', userDetails)
    const { userId, teamId } = userDetails

    let team = await this.storage.teams.get(teamId)
    let isNew = false
    if (!team) {
      isNew = true
      team = {
        id: teamId,
        createdBy: userId,
      }
    }

    if (auth.bot) {
      team.bot = {
        token: auth.bot.bot_access_token,
        userId: auth.bot.bot_user_id,
        createdBy: userId,
      }
      this.emit('create_bot', team)
    }

    team = await this.storage.teams.save({ team, isNew })
    if (isNew) {
      this.emit('create_team', team)
    } else {
      this.emit('update_team', team)
    }

    const scopes = auth.scope.split(',')
    let user = await this.storage.users.get(userId)
    isNew = false
    if (!user) {
      isNew = true
      user = {
        id: userId,
        teamId,
      }
    }
    user.accessToken = auth.access_token
    user.scopes = scopes

    user = await this.storage.users.save({ user, isNew })
    if (isNew) {
      this.emit('create_user', user)
    } else {
      this.emit('update_user', user)
    }

    /*eslint-disable no-param-reassign*/
    res.locals.auth = auth
    res.locals.user = user
    res.locals.team = team
    /*eslint-enable no-param-reassign*/
  }

  createAuthEndpoints(app, cb) {
    if (this.scopes.login) {
      app.get('/login', (req, res) => {
        res.redirect(this.getLoginURL())
      })
    }

    if (this.scopes.install) {
      app.get('/install', (req, res) => {
        res.redirect(this.getInstallURL())
      })
    }

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
        cb(null, req, res)
      } else {
        res.redirect('/')
      }

      const { locals: { auth, user, team } } = res
      this.emit('authenticated', { auth, user, team })
    })
  }

}

export default Server
