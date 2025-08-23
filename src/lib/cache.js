/**
 * A cache read-through implementation
 * @param {NodeCache} cache The cache instance to use
 * @param {string} key The cache key
 * @param {Function} fetchFunction Function to fetch data if not in cache
 * @returns {any} The cached or freshly fetched data
 */
async function cacheReadthrough(cache, key, fetchFunction) {
  const cachedData = cache.get(key);
  
  if (cachedData) {
    return cachedData;
  }
  
  const freshData = await fetchFunction();
  cache.set(key, freshData);
  
  return freshData;
}

export default cacheReadthrough;