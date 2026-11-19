const Redis = require('ioredis');

// Resilient Redis client with in-memory TTL Map fallback
class InMemoryRedisFallback {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
  }

  async get(key) {
    if (this.ttls.has(key)) {
      if (Date.now() > this.ttls.get(key)) {
        this.store.delete(key);
        this.ttls.delete(key);
        return null;
      }
    }
    return this.store.get(key) || null;
  }

  async set(key, value, mode, duration) {
    this.store.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    if (mode === 'EX' && duration) {
      this.ttls.set(key, Date.now() + duration * 1000);
    }
    return 'OK';
  }

  async del(key) {
    this.store.delete(key);
    this.ttls.delete(key);
    return 1;
  }

  async expire(key, seconds) {
    if (this.store.has(key)) {
      this.ttls.set(key, Date.now() + seconds * 1000);
      return 1;
    }
    return 0;
  }

  async keys(pattern) {
    const now = Date.now();
    for (const [key, expireAt] of this.ttls.entries()) {
      if (now > expireAt) {
        this.store.delete(key);
        this.ttls.delete(key);
      }
    }
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.store.keys()).filter((k) => regex.test(k));
  }
}

const memoryFallback = new InMemoryRedisFallback();
let realRedisClient = null;
let isRedisConnected = false;

const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST;

// Only attempt connecting if REDIS_URL is provided or explicit remote REDIS_HOST
if (redisUrl || (redisHost && redisHost !== '127.0.0.1' && redisHost !== 'localhost')) {
  try {
    realRedisClient = new Redis(redisUrl || {
      host: redisHost,
      port: process.env.REDIS_PORT || 6379,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: true,
    });

    realRedisClient.on('connect', () => {
      isRedisConnected = true;
      console.log('✅ [Redis] Connected to external Redis instance');
    });

    realRedisClient.on('error', (err) => {
      isRedisConnected = false;
      console.warn('⚠️ [Redis] External connection error, defaulting to in-memory TTL store:', err.message);
    });

    realRedisClient.on('close', () => {
      isRedisConnected = false;
    });

    realRedisClient.connect().catch(() => {
      isRedisConnected = false;
    });
  } catch (err) {
    isRedisConnected = false;
    console.warn('⚠️ [Redis] Client setup error, using in-memory TTL store');
  }
} else {
  console.log('⚡ [Redis] Running with resilient in-memory TTL lock cache');
}

// Resilient wrapper proxy ensuring NO unhandled connection errors crash the app
const redisProxy = new Proxy({}, {
  get(target, prop) {
    return async (...args) => {
      if (isRedisConnected && realRedisClient && realRedisClient.status === 'ready') {
        try {
          return await realRedisClient[prop](...args);
        } catch (err) {
          console.warn(`[Redis] Command ${prop} failed on remote instance, falling back to memory store:`, err.message);
          if (typeof memoryFallback[prop] === 'function') {
            return await memoryFallback[prop](...args);
          }
        }
      }
      if (typeof memoryFallback[prop] === 'function') {
        return await memoryFallback[prop](...args);
      }
      return null;
    };
  },
});

module.exports = redisProxy;
