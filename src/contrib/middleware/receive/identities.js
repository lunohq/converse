/*eslint-disable no-param-reassign*/
export default async function identities({ ctx, next }) {
  const { bot: { rtm } } = ctx
  const { activeUserId: botId, activeTeamId: teamId } = rtm

  let bot = {}
  let team = {}
  if (rtm.dataStore) {
    bot = rtm.dataStore.getUserById(botId)
    team = rtm.dataStore.getTeamById(teamId)
  }
  ctx.identites = {
    bot: {
      id: botId,
      ...bot,
    },
    team: {
      id: teamId,
      ...team,
    },
  }
  next()
}
/*eslint-enable no-param-reassign*/
