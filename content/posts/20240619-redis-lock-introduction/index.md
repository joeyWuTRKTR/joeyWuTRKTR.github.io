# Redis lock
1. 性能高（寫在memory）、 最終一致性
2. 預防死鎖（Deadlock free），Lock在ttl後自動釋放，避免握有lock的client當機，lock不能被釋放
3. 分布式鎖，避免單點故障（Fault Tolerance），redis跨cluster部署
4. 互斥（mutual exclusive），同一時間只有一個client可以取得鎖

## Demo
***

流程
{{<img src="/img/20240619-redis-lock-introduction/redis-lock.png" width="30%">}}

redlock & ioredis
```javascript
// redis.js

const Redis = require('ioredis');
const Redlock = require('redlock');
const {config} = require('../config');

const redis = new Redis(`redis://:${config.redis.password}@${config.redis.host}:${config.redis.port}`);

// 可以帶入多個clients
const redisClients = [redis];
const redlock = new Redlock(redisClients);

async function acquireLock(resource, ttl, options) {
  return await redlock.acquireWithOptions(resource, ttl, options);
}

async function releaseLock(lock) {
  await lock.unlock();
}

async function setRedisWithExpiry(key, value, expiry) {
  return redis.set(key, value, 'EX', expiry);
}

async function getRedis(key) {
  return redis.get(key);
}

module.exports = {
  acquireLock,
  releaseLock,
  setRedisWithExpiry,
  getRedis,
};
```

redisLock 放在程式碼的入口  
輪流取得資源(redis lock)

```javascript
// main.js

let redisLock, result;
const redisLockResource = 'service:redisLockResource';
const expiredKey = 'service:expired';

try {
  // Redlock 的 ttl 單位是毫秒，設定鎖住時間為 300 秒
  redisLock = await acquireLock(redisLockResource, 300 * 1000, {
    retryCount: -1,  // -1 unlimited retries, 0 for no retry
  });
  const expired = await getRedis(expiredKey);
  if (!expired) {
    // 查詢多張表並且做一些計算
    await doHearvyQueryAndInsert();
    
    // 第一個人insert資料後用key做個記號，限制 5 分鐘內不重複取資料
    // ioredis 的 ttl 單位是秒，設定鎖住時間為 300 秒
    await setRedisWithExpiry(expiredKey, new Date().getTime(), 300);
  }
} catch (error) {
  console.error('catch Error:', error);
} finally {
  if (redisLock !== null) {
    // 查詢insert後的資料
    await queryInsertedData();
    
    // 把redisLock釋放掉
    await releaseLock(redisLock); // release lock every time after user querying
  }
}
```

## Redis
### 單個Redis Node
#### 用SETNX + PX 上鎖，搭配lua腳本取鎖、釋放鎖

SETNX: SET if Not exists
PX: expiration (milliseconds)
lua腳本：若同一個人在ttl內取得已經上鎖的鎖，則可以把鎖釋放

```shell

# 鎖 60 秒
127.0.0.1:6379> SET lock_for_resource_1 uuid1 NX PX 60000

# 如果是同一個client，可以取得鎖
127.0.0.1:6379> EVAL "if redis.call(\"get\", KEYS[1]) == ARGV[1] then return redis.call(\"del\", KEYS[1]) else return 0 end" 1 lock_for_resource_1 uuid1
(integer) 1

# 如果是不同的client，無法取得鎖
127.0.0.1:6379> EVAL "if redis.call(\"get\", KEYS[1]) == ARGV[1] then return redis.call(\"del\", KEYS[1]) else return 0 end" 1 lock_for_resource_1 uuid2
(integer) 0

```

### 多個Redis Node
#### Redlock演算法  
Redis 實例數量設定 N >= 3 的奇數  
如果同一個資源被過半數以上的 Redis Nodes 取得，
且時間小於ttl - 系統允許誤差時間， 則該資源可以被鎖住

節點需要在5-50ms取得鎖，否則timeout（防止節點死亡，資源被卡住）

```javascript
// redlock.js(node-redis)
// execute redis resource/value lock
request = function(server, loop){
  return self._executeScript(server, 'lockScript', [
    resource.length,
    ...resource,
    value,
    ttl
  ], loop);
};

// loop all redis nodes
self.servers.forEach(function(server){
  return request(server, loop);
});


// if locked over half redis nodes and within ttl, lock the resouce
const lock = new Lock(self, resource, value, start + ttl - drift, attempts, retryCount - attempts);

if(votes >= quorum && lock.expiration > Date.now()) return resolve(lock);
```

## Tools
***
1. node version: v16.19.1  
2. redlock "^4.2.0"(目前最新版是 5.0.0-beta.2，目前仍有bug，建議降版使用 4.2.0 版本)  
3. ioredis: "^5.4.1"


## Reference
***
面试官：说一下红锁RedLock的实现原理？
https://www.cnblogs.com/vipstone/p/18036976

Redis Lock (Redlock) 分散式 lock 原理分析與實作: 
https://yuanchieh.page/posts/2020/2020-01-14_redis-lock-redlock-%E5%8E%9F%E7%90%86%E5%88%86%E6%9E%90%E8%88%87%E5%AF%A6%E4%BD%9C/

Distributed Locks with Redis:
https://redis.io/docs/latest/develop/use/patterns/distributed-locks/

node-redlock: 
https://github.com/mike-marcacci/node-redlock

Achieving Distributed Locking in Node.js with Redis and Redlock:
https://medium.com/@ayushnandanwar003/achieving-distributed-locking-in-node-js-with-redis-and-redlock-0574f5ac333d
