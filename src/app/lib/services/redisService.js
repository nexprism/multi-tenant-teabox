import { redisWrapper } from '../config/redis.js';

class RedisService {
  constructor() {
    this.wrapper = redisWrapper;
  }

  // Get Redis status
  getStatus() {
    return this.wrapper.getStatus();
  }

  // Enable Redis
  async enable() {
    await this.wrapper.enable();
    return this.getStatus();
  }

  // Disable Redis  
  async disable() {
    await this.wrapper.disable();
    return this.getStatus();
  }

  // Toggle Redis state
  async toggle() {
    if (this.wrapper.isEnabled()) {
      return await this.disable();
    } else {
      return await this.enable();
    }
  }

  // Test Redis functionality
  async test() {
    try {
      const client = await this.wrapper.getClient();
      const testKey = `redis-test:${Date.now()}`;
      const testValue = JSON.stringify({
        timestamp: new Date().toISOString(),
        test: 'Redis functionality test'
      });

      // Test basic operations
      await client.set(testKey, testValue);
      const retrieved = await client.get(testKey);
      await client.del(testKey);

      const success = retrieved === testValue;

      return {
        success,
        enabled: this.wrapper.isEnabled(),
        operations: {
          set: true,
          get: retrieved !== null,
          delete: true,
          valueMatch: success
        },
        testData: {
          stored: testValue,
          retrieved,
          key: testKey
        }
      };
    } catch (error) {
      return {
        success: false,
        enabled: this.wrapper.isEnabled(),
        error: error.message,
        operations: {
          set: false,
          get: false,
          delete: false,
          valueMatch: false
        }
      };
    }
  }

  // Clear all Redis data
  async clear() {
    try {
      const client = await this.wrapper.getClient();
      await client.flushall();
      return {
        success: true,
        message: 'Redis cache cleared successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to clear Redis cache',
        error: error.message
      };
    }
  }

  // Get cache statistics (mock implementation for demo)
  async getStats() {
    try {
      const client = await this.wrapper.getClient();
      const keys = await client.keys('*');
      
      // Group keys by prefix for insights
      const keyGroups = {};
      keys.forEach(key => {
        const prefix = key.split(':')[0] || 'no-prefix';
        keyGroups[prefix] = (keyGroups[prefix] || 0) + 1;
      });

      return {
        success: true,
        enabled: this.wrapper.isEnabled(),
        totalKeys: keys.length,
        keyGroups,
        sampleKeys: keys.slice(0, 10), // Show first 10 keys as samples
        status: this.getStatus()
      };
    } catch (error) {
      return {
        success: false,
        enabled: this.wrapper.isEnabled(),
        error: error.message,
        status: this.getStatus()
      };
    }
  }

  // Reconnect Redis
  async reconnect() {
    try {
      await this.wrapper.disconnect();
      await this.wrapper.enable();
      return {
        success: true,
        message: 'Redis reconnected successfully',
        status: this.getStatus()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to reconnect Redis',
        error: error.message,
        status: this.getStatus()
      };
    }
  }

  // Advanced: Set with automatic JSON serialization
  async setJSON(key, value, ttl = null) {
    try {
      const client = await this.wrapper.getClient();
      const serialized = JSON.stringify(value);
      
      if (ttl) {
        await client.setex(key, ttl, serialized);
      } else {
        await client.set(key, serialized);
      }
      
      return { success: true, key, ttl };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Advanced: Get with automatic JSON deserialization
  async getJSON(key) {
    try {
      const client = await this.wrapper.getClient();
      const value = await client.get(key);
      
      if (value === null) {
        return { success: true, data: null, exists: false };
      }
      
      try {
        const parsed = JSON.parse(value);
        return { success: true, data: parsed, exists: true };
      } catch (parseError) {
        // Return raw value if not JSON
        return { success: true, data: value, exists: true, isRaw: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Cache wrapper function
  async cache(key, fetcher, ttl = 300) {
    try {
      // Try to get from cache first
      const cached = await this.getJSON(key);
      if (cached.success && cached.exists) {
        return { success: true, data: cached.data, fromCache: true };
      }

      // If not in cache, fetch and store
      const data = await fetcher();
      await this.setJSON(key, data, ttl);
      
      return { success: true, data, fromCache: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
const redisService = new RedisService();

export default redisService;
