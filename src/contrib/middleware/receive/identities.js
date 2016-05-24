const debug = require('debug')('converse:contrib:middleware:receive:identities')

/*eslint-disable no-param-reassign*/
export default async function identities({ ctx, next }) {
  const { bot: { rtm } } = ctx
  const { activeUserId: botId, activeTeamId: teamId } = rtm

  let bot = {}
  let team = {}
  debug('Attaching identities')
  if (rtm.dataStore) {
    bot = rtm.dataStore.getUserById(botId)
    team = rtm.dataStore.getTeamById(teamId)
  } else {
    debug('No datastore configured for rtm')
  }
  ctx.identities = {
    bot: {
      id: botId,
      ...bot,
    },
    team: {
      id: teamId,
      ...team,
    },
  }
  return next()
}
/*eslint-enable no-param-reassign*/
