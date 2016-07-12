import { MemoryDataStore } from '@slack/client'
import RedisDataStore from 'slack-redis-data-store'

class DataStore extends MemoryDataStore {

  constructor(opts = {}) {
    super(opts)
    this.redisDataStore = new RedisDataStore(opts.redisDataStoreOpts)
  }

  cacheRtmStart(data) {
    super.cacheRtmStart(data)
    this.redisDataStore.cacheRtmStart(data)
  }

}

export default DataStore
