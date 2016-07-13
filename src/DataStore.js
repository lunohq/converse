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
  }

  cacheRtmStart(data) {
    super.cacheRtmStart(data)
    this.redisDataStore.cacheRtmStart(data)
  }

}

export default DataStore
