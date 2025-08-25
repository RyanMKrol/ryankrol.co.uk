import NodeCache from 'node-cache';

// 4 hours cache (4 * 60 * 60 seconds)
const FOUR_HOURS = 4 * 60 * 60;

// Global cache instance
const apiCache = new NodeCache({ 
  stdTTL: FOUR_HOURS,
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false
});

/**
 * Mandatory API caching wrapper - forces every API to use cache
 * This function MUST be used for all API responses to ensure consistent caching
 * 
 * @param {string} cacheKey - Unique key for this API call
 * @param {Function} fetchFunction - Async function that fetches the data
 * @param {number} [ttl] - Optional custom TTL in seconds (default: 4 hours)
 * @param {Function} [onCacheMiss] - Optional callback executed on cache miss (async, fire-and-forget)
 * @returns {Promise<any>} The cached or freshly fetched data
 */
export async function withApiCache(cacheKey, fetchFunction, ttl = FOUR_HOURS, onCacheMiss = null) {
  if (!cacheKey) {
    throw new Error('Cache key is required for all API calls');
  }
  
  if (typeof fetchFunction !== 'function') {
    throw new Error('Fetch function is required and must be a function');
  }

  // Check cache first
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) {
    console.log(`💰 [CACHE] HIT for key: ${cacheKey}`);
    return cachedData;
  }

  console.log(`❄️  [CACHE] MISS for key: ${cacheKey}`);
  
  // Trigger cache miss callback in background if provided
  if (onCacheMiss && typeof onCacheMiss === 'function') {
    console.log(`🔄 [CACHE] Triggering cache miss callback for: ${cacheKey}`);
    setImmediate(async () => {
      try {
        await onCacheMiss();
      } catch (error) {
        console.error('❌ [CACHE] Cache miss callback error:', error);
      }
    });
  }
  
  try {
    // Fetch fresh data
    const fetchStartTime = Date.now();
    const freshData = await fetchFunction();
    const fetchTime = Date.now() - fetchStartTime;
    
    // Store in cache with custom TTL if provided
    if (ttl !== FOUR_HOURS) {
      apiCache.set(cacheKey, freshData, ttl);
      console.log(`💾 [CACHE] Stored key: ${cacheKey} (TTL: ${ttl}s, fetch: ${fetchTime}ms)`);
    } else {
      apiCache.set(cacheKey, freshData);
      console.log(`💾 [CACHE] Stored key: ${cacheKey} (TTL: 4h, fetch: ${fetchTime}ms)`);
    }
    
    return freshData;
  } catch (error) {
    console.error(`❌ [CACHE] Error fetching data for key ${cacheKey}:`, error);
    throw error;
  }
}

/**
 * Generate a standardized cache key for API endpoints
 * @param {string} endpoint - The API endpoint name
 * @param {Object} [params] - Optional parameters to include in the key
 * @returns {string} A standardized cache key
 */
export function generateCacheKey(endpoint, params = {}) {
  const paramString = Object.keys(params).length > 0 
    ? `-${Object.entries(params).map(([k, v]) => `${k}:${v}`).join('-')}`
    : '';
  
  return `api-${endpoint}${paramString}`;
}

/**
 * Clear cache for a specific key or all keys matching a pattern
 * @param {string} [keyOrPattern] - Specific key or pattern to clear (if empty, clears all)
 */
export function clearApiCache(keyOrPattern) {
  if (!keyOrPattern) {
    apiCache.flushAll();
    console.log('Cleared entire API cache');
    return;
  }
  
  if (keyOrPattern.includes('*')) {
    // Pattern matching - clear all keys that match
    const keys = apiCache.keys();
    const pattern = keyOrPattern.replace(/\*/g, '.*');
    const regex = new RegExp(pattern);
    
    keys.forEach(key => {
      if (regex.test(key)) {
        apiCache.del(key);
        console.log(`Cleared cache for key: ${key}`);
      }
    });
  } else {
    // Exact key match
    apiCache.del(keyOrPattern);
    console.log(`Cleared cache for key: ${keyOrPattern}`);
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  const stats = apiCache.getStats();
  const keys = apiCache.keys();
  
  return {
    ...stats,
    totalKeys: keys.length,
    keys: keys
  };
}

export default apiCache;