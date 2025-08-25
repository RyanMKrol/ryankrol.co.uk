import { withApiCache, generateCacheKey } from '../../../lib/apiCache';
import { getWorkoutStats } from '../../../lib/workoutQueries';
import { triggerBackfillAsync } from '../../../lib/workoutBackfill';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Generate cache key for workout stats
    const cacheKey = generateCacheKey('workout-stats');
    
    // Use mandatory caching wrapper with longer TTL for stats (6 hours) and backfill trigger
    const stats = await withApiCache(
      cacheKey, 
      async () => {
        return await getWorkoutStats();
      }, 
      6 * 60 * 60, // 6 hours in seconds
      triggerBackfillAsync // Trigger backfill on cache miss
    );
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching workout stats:', error);
    res.status(500).json({ 
      message: 'Error fetching workout statistics',
      error: error.message 
    });
  }
}