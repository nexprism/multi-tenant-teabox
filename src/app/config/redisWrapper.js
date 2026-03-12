import redisConfig from './redisConfig.js';

// Redis wrapper that respects global enable/disable state
class RedisWrapper {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (!this.initialized) {
      await redisConfig.initialize();
      this.initialized = true;
    }
    return redisConfig.getClient();
  }

  // Enable Redis globally
  async enable() {
    await redisConfig.setEnabled(true);
    this.initialized = false; // Force re-initialization
  }

  // Disable Redis globally
  async disable() {
    await redisConfig.setEnabled(false);
  }

  // Check if Redis is enabled
  isEnabled() {
    return redisConfig.isRedisEnabled();
  }

  // Get status
  getStatus() {
    return redisConfig.getStatus();
  }

  // Get Redis client (automatically initializes if needed)
  async getClient() {
    return await this.init();
  }

  // Convenience methods that auto-initialize
  async get(key) {
    const client = await this.getClient();
    return await client.get(key);
  }

  async set(key, value, ...args) {
    const client = await this.getClient();
    return await client.set(key, value, ...args);
  }

  async setex(key, seconds, value) {
    const client = await this.getClient();
    return await client.setex(key, seconds, value);
  }

  async del(key) {
    const client = await this.getClient();
    return await client.del(key);
  }

  async exists(key) {
    const client = await this.getClient();
    return await client.exists(key);
  }

  async ping() {
    const client = await this.getClient();
    return await client.ping();
  }

  async flushall() {
    const client = await this.getClient();
    return await client.flushall();
  }

  async keys(pattern) {
    const client = await this.getClient();
    return await client.keys(pattern);
  }

  async hget(key, field) {
    const client = await this.getClient();
    return await client.hget(key, field);
  }

  async hset(key, field, value) {
    const client = await this.getClient();
    return await client.hset(key, field, value);
  }

  async hdel(key, field) {
    const client = await this.getClient();
    return await client.hdel(key, field);
  }

  async expire(key, seconds) {
    const client = await this.getClient();
    return await client.expire(key, seconds);
  }

  async ttl(key) {
    const client = await this.getClient();
    return await client.ttl(key);
  }

  // Cleanup
  async disconnect() {
    await redisConfig.disconnect();
    this.initialized = false;
  }
}

// Singleton instance
const redisWrapper = new RedisWrapper();

export default redisWrapper;

// Legacy support - maintain compatibility with existing initRedis function
export function initRedis() {
  //consolle.warn('⚠️ initRedis() is deprecated. Use redisWrapper directly for better control.');
  return redisWrapper.getClient();
}
