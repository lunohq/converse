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

  getLoginUserDetails = async (auth) => auth

  getInstallUserDetails = async (auth) => {
    const api = new WebClient(auth.access_token)
    const details = await api.auth.test()
    debug('Install User Details', details)
    return {
      team: {
        id: details.team_id,
        name: details.team,
      },
      user: {
        id: details.user_id,
        name: details.user,
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

    let userDetails
    switch (state) {
      case 'login':
        debug('Fetching login user details', { state })
        userDetails = await this.getLoginUserDetails(auth)
        break
      default:
        debug('Fetching install user details', { state })
        userDetails = await this.getInstallUserDetails(auth)
    }

    debug('OAuth User Details', userDetails)
    const {
      user: { id: userId, email: userEmail, name: userName },
      team: { id: teamId, name: teamName, domain: teamDomain },
    } = userDetails

    const isNew = {
      team: false,
      user: false,
      bot: false,
    }

    let team = await this.storage.teams.get(teamId)
    if (!team) {
      isNew.team = true
      team = {
        id: teamId,
        createdBy: userId,
      }
      if (teamName) {
        team.name = teamName
      }
      if (teamDomain) {
        team.domain = teamDomain
      }
    }

    if (!team.bot && auth.bot) {
      isNew.bot = true
      team.bot = {
        token: auth.bot.bot_access_token,
        userId: auth.bot.bot_user_id,
        createdBy: userId,
      }
      this.emit('create_bot', team)
    }

    debug('Saving team', { team, isNew: isNew.team })
    team = await this.storage.teams.save({ team, isNew: isNew.team })
    if (isNew.team) {
      this.emit('create_team', team)
    } else {
      this.emit('update_team', team)
    }

    const scopes = auth.scope.split(',')
    let user = await this.storage.users.get(userId)
    if (!user) {
      isNew.user = true
      user = {
        id: userId,
        teamId,
      }
      if (userEmail) {
        user.email = userEmail
      }
      if (userName) {
        user.user = userName
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
        cb(null, req, res)
      } else {
        res.redirect('/')
      }

      const { locals: { auth, user, team, isNew } } = res
      this.emit('authenticated', { auth, user, team, isNew })
    })
  }

}

export default Server
