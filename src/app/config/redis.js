import redisWrapper from './redisWrapper.js';

// Legacy function - maintained for backward compatibility
export default function initRedis() {
  //consolle.warn('⚠️ initRedis() is deprecated. Consider using redisWrapper directly for better control.');
  return redisWrapper.getClient();
}

// Export the wrapper for direct access to new features
export { default as redisWrapper } from './redisWrapper.js';
