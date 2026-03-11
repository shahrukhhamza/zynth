/**
 * API Key Manager with automatic rotation and fallback
 * Handles multiple API keys and switches when rate limits are hit
 */

class ApiKeyManager {
  constructor() {
    // Delay initialization until first use
    this.initialized = false;
    this.apiKeys = [];
    this.currentIndex = 0;
    this.keyStatus = new Map();
  }
  
  /**
   * Initialize the manager (lazy initialization)
   */
  initialize() {
    if (this.initialized) return;
    
    // Load API keys from environment
    this.apiKeys = this.loadApiKeys();
    this.currentIndex = 0;
    this.keyStatus = new Map();
    
    // Initialize all keys as available
    this.apiKeys.forEach((key, index) => {
      this.keyStatus.set(index, {
        available: true,
        failCount: 0,
        lastFail: null,
        totalRequests: 0,
        successfulRequests: 0
      });
    });
    
    this.initialized = true;
    console.log(`🔑 API Key Manager initialized with ${this.apiKeys.length} keys`);
  }
  
  /**
   * Load API keys from environment variables
   * Supports POLYGON_API_KEY, POLYGON_API_KEY_2, POLYGON_API_KEY_3, etc.
   */
  loadApiKeys() {
    const keys = [];
    
    // Primary key
    if (process.env.POLYGON_API_KEY) {
      keys.push(process.env.POLYGON_API_KEY);
    }
    
    // Additional keys (POLYGON_API_KEY_2, POLYGON_API_KEY_3, etc.)
    let index = 2;
    while (process.env[`POLYGON_API_KEY_${index}`]) {
      keys.push(process.env[`POLYGON_API_KEY_${index}`]);
      index++;
    }
    
    if (keys.length === 0) {
      console.warn('⚠️  No API keys found in environment variables');
    }
    
    return keys;
  }
  
  /**
   * Get the current active API key
   */
  getCurrentKey() {
    this.initialize(); // Ensure initialized
    
    if (this.apiKeys.length === 0) {
      return null;
    }
    
    // Find next available key
    const startIndex = this.currentIndex;
    let attempts = 0;
    
    while (attempts < this.apiKeys.length) {
      const status = this.keyStatus.get(this.currentIndex);
      
      // Check if key is available or if cooldown period has passed (5 minutes)
      if (status.available || this.isCooldownExpired(status.lastFail)) {
        // Reset fail count if cooldown expired
        if (!status.available && this.isCooldownExpired(status.lastFail)) {
          status.available = true;
          status.failCount = 0;
          console.log(`✅ API Key #${this.currentIndex + 1} cooldown expired, marking as available`);
        }
        
        return {
          key: this.apiKeys[this.currentIndex],
          index: this.currentIndex
        };
      }
      
      // Move to next key
      this.currentIndex = (this.currentIndex + 1) % this.apiKeys.length;
      attempts++;
    }
    
    // All keys exhausted, return first one anyway and log warning
    console.warn('⚠️  All API keys exhausted, using first key anyway');
    this.currentIndex = 0;
    return {
      key: this.apiKeys[0],
      index: 0
    };
  }
  
  /**
   * Check if cooldown period (5 minutes) has expired
   */
  isCooldownExpired(lastFailTime) {
    if (!lastFailTime) return true;
    const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
    return Date.now() - lastFailTime > COOLDOWN_MS;
  }
  
  /**
   * Mark current key as rate limited and rotate to next
   */
  markCurrentKeyAsLimited() {
    if (this.apiKeys.length === 0) return;
    
    const status = this.keyStatus.get(this.currentIndex);
    status.available = false;
    status.failCount++;
    status.lastFail = Date.now();
    
    console.log(`❌ API Key #${this.currentIndex + 1} hit rate limit (fail count: ${status.failCount})`);
    
    // Rotate to next key
    const oldIndex = this.currentIndex;
    this.currentIndex = (this.currentIndex + 1) % this.apiKeys.length;
    
    console.log(`🔄 Rotating from Key #${oldIndex + 1} to Key #${this.currentIndex + 1}`);
  }
  
  /**
   * Mark a request as successful
   */
  markRequestSuccess(keyIndex) {
    const status = this.keyStatus.get(keyIndex);
    if (status) {
      status.totalRequests++;
      status.successfulRequests++;
    }
  }
  
  /**
   * Mark a request as failed
   */
  markRequestFailed(keyIndex, isRateLimit = false) {
    const status = this.keyStatus.get(keyIndex);
    if (status) {
      status.totalRequests++;
      
      if (isRateLimit) {
        status.available = false;
        status.failCount++;
        status.lastFail = Date.now();
      }
    }
  }
  
  /**
   * Get statistics for all keys
   */
  getStats() {
    const stats = [];
    
    this.apiKeys.forEach((key, index) => {
      const status = this.keyStatus.get(index);
      const maskedKey = this.maskKey(key);
      
      stats.push({
        index: index + 1,
        key: maskedKey,
        available: status.available,
        failCount: status.failCount,
        totalRequests: status.totalRequests,
        successfulRequests: status.successfulRequests,
        successRate: status.totalRequests > 0 
          ? ((status.successfulRequests / status.totalRequests) * 100).toFixed(1) + '%'
          : 'N/A',
        lastFail: status.lastFail ? new Date(status.lastFail).toISOString() : 'Never'
      });
    });
    
    return stats;
  }
  
  /**
   * Mask API key for logging (show only first 4 and last 4 chars)
   */
  maskKey(key) {
    if (!key || key.length < 8) return '***';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }
  
  /**
   * Check if an error is a rate limit error
   */
  static isRateLimitError(error) {
    if (!error) return false;
    
    // Check HTTP status codes
    if (error.response) {
      const status = error.response.status;
      // 429 = Too Many Requests, 403 = Forbidden (sometimes used for rate limits)
      if (status === 429 || status === 403) {
        return true;
      }
    }
    
    // Check error message
    const errorMessage = error.message?.toLowerCase() || '';
    const rateLimitKeywords = ['rate limit', 'too many requests', 'quota exceeded', 'limit exceeded'];
    
    return rateLimitKeywords.some(keyword => errorMessage.includes(keyword));
  }
  
  /**
   * Reset all keys (useful for testing)
   */
  resetAllKeys() {
    this.apiKeys.forEach((key, index) => {
      this.keyStatus.set(index, {
        available: true,
        failCount: 0,
        lastFail: null,
        totalRequests: 0,
        successfulRequests: 0
      });
    });
    this.currentIndex = 0;
    console.log('🔄 All API keys reset');
  }
}

// Singleton instance
let instance = null;

export function getApiKeyManager() {
  if (!instance) {
    instance = new ApiKeyManager();
  }
  return instance;
}

export default ApiKeyManager;
