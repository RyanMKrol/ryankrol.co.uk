import { withApiCache, generateCacheKey } from '../../lib/apiCache';
import { getWorkoutsPaginated } from '../../lib/workoutQueries';
import { triggerBackfillAsync } from '../../lib/workoutBackfill';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    
    // Generate cache key for this specific request
    const cacheKey = generateCacheKey('workouts-dynamo', { page, pageSize });
    
    // Only trigger backfill on first page cache misses
    const shouldTriggerBackfill = page === 1;
    
    // Use mandatory caching wrapper with conditional backfill trigger
    const workoutData = await withApiCache(
      cacheKey, 
      async () => {
        return await getWorkoutsPaginated(page, pageSize);
      },
      4 * 60 * 60, // 4 hours TTL
      shouldTriggerBackfill ? triggerBackfillAsync : null // Only trigger backfill on page 1
    );
    
    if (shouldTriggerBackfill) {
      console.log('📄 [API] First page requested - backfill may be triggered on cache miss');
    } else {
      console.log(`📄 [API] Page ${page} requested - backfill will NOT be triggered`);
    }
    
    res.status(200).json(workoutData);
  } catch (error) {
    console.error('Error fetching workouts from DynamoDB:', error);
    res.status(500).json({ 
      message: 'Error fetching workouts',
      error: error.message 
    });
  }
}