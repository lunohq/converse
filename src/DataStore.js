import { MemoryDataStore } from '@slack/client'
import RedisDataStore from 'slack-redis-data-store'

class DataStore extends MemoryDataStore {

  constructor(opts = {}) {
    super(opts)
    let { redisDataStoreOpts } = opts
    if (opts.team) {
      redisDataStoreOpts = { keyPrefix: `s.cache.${opts.team.id}.`, ...redisDataStoreOpts }
    }
    this.redisDataStore = new RedisDataStore(redisDataStoreOpts)
    // sync the redis data store with the in memory data store every 30 seconds
    setInterval(() => {
      this.redisDataStore.cacheData({
        users: this.users,
        channels: this.channels,
        dms: this.dms,
        groups: this.groups,
        bots: this.bots,
        teams: this.teams,
      })
    }, 1000 * 30)
  }

  cacheRtmStart(data) {
    super.cacheRtmStart(data)
    this.redisDataStore.cacheRtmStart(data)
  }

}

export default DataStore
