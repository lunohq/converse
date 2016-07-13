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
      const data = {
        users: Object.values(this.users).map(obj => obj.toJSON()),
        channels: Object.values(this.channels).map(obj => obj.toJSON()),
        dms: Object.values(this.dms).map(obj => obj.toJSON()),
        groups: Object.values(this.groups).map(obj => obj.toJSON()),
        bots: Object.values(this.bots),
        teams: Object.values(this.teams),
      }
      this.redisDataStore.cacheData(data)
    }, 1000 * 30)
  }

  cacheRtmStart(data) {
    super.cacheRtmStart(data)
    this.redisDataStore.cacheRtmStart(data)
  }

}

export default DataStore
