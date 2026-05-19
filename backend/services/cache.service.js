const { logger } = require('../utils/logger');

let redis     = null;
let available = false;

/**
 * Initialise Redis connection (ioredis).
 * Falls back silently if Redis is not running — caching simply becomes a no-op.
 */
async function initRedis() {
  if (process.env.USE_QUEUE !== 'true' && process.env.USE_CACHE !== 'true') {
    logger.info('[Cache] Redis disabled by env (USE_CACHE=false). Running without cache.');
    return;
  }

  try {
    const Redis = require('ioredis');
    redis = new Redis({
      host:           process.env.REDIS_HOST     || 'localhost',
      port:           parseInt(process.env.REDIS_PORT) || 6379,
      password:       process.env.REDIS_PASSWORD || undefined,
      lazyConnect:    true,
      enableReadyCheck: false,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // don't retry — fail fast
    });

    await redis.connect();
    await redis.ping();
    available = true;
    logger.info('[Cache] Redis connected successfully.');
  } catch (err) {
    redis     = null;
    available = false;
    logger.warn('[Cache] Redis unavailable — running without cache:', err.message);
  }
}

/**
 * Get a cached value. Returns null on miss or if Redis is unavailable.
 */
async function get(key) {
  if (!available) return null;
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Set a cached value with optional TTL (seconds).
 */
async function set(key, value, ttlSeconds = 60) {
  if (!available) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Silently ignore cache write failures
  }
}

/**
 * Delete one or more cache keys. Supports glob patterns via SCAN.
 */
async function del(...keys) {
  if (!available) return;
  try {
    await redis.del(...keys);
  } catch {
    // Ignore
  }
}

/**
 * Delete all keys matching a pattern (e.g. 'leaderboard:*')
 */
async function delPattern(pattern) {
  if (!available) return;
  try {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== '0');
  } catch {
    // Ignore
  }
}

/**
 * Express middleware: cache GET responses.
 * Usage: router.get('/path', cache.middleware(60), handler)
 */
function middleware(ttlSeconds = 60) {
  return async (req, res, next) => {
    if (!available || req.method !== 'GET') return next();

    const key = `cache:${req.originalUrl}`;
    const hit = await get(key);
    if (hit) return res.json(hit);

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200) set(key, body, ttlSeconds);
      return originalJson(body);
    };
    next();
  };
}

module.exports = { initRedis, get, set, del, delPattern, middleware, isAvailable: () => available };
