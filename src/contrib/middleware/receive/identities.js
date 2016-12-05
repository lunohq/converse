const debug = require('debug')('converse:contrib:middleware:receive:identities')

/*eslint-disable no-param-reassign*/
export default async function identities({ ctx, next }) {
  const { bot: { rtm } } = ctx
  const { activeUserId: botId, activeTeamId: teamId } = rtm

  let bot = {}
  let team = {}
  debug('Attaching identities')
  if (rtm.dataStore) {
    const results = await Promise.all([
      rtm.dataStore.getUserById(botId),
      rtm.dataStore.getTeamById(teamId),
    ])
    bot = results[0]
    team = results[1]
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
