const Redis = require('ioredis');

let redisInstance = null;

function createRedisClient() {
  if (!redisInstance) {
    redisInstance = new Redis({
      host: 'db-redis-blr1-55103-do-user-13729304-0.c.db.ondigitalocean.com',
      port: 25061,
      password: 'AVNS_3Sj9qjkIRWdTG_4UIph',
      retryStrategy: null
    });

    redisInstance.on('connect', () => {
      console.log('Connected to Redis');
    });

    redisInstance.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }
  return redisInstance;
}

module.exports = createRedisClient;
