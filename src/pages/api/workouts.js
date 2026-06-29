import { withApiCache, generateCacheKey } from '../../lib/apiCache';
import { getWorkoutsPaginated, getAllWorkouts } from '../../lib/workoutQueries';
import { triggerBackfillAsync } from '../../lib/workoutBackfill';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // mode=all: return every workout for client-side filter + pagination
    if (req.query.mode === 'all') {
      const cacheKey = generateCacheKey('workouts-dynamo-all');
      console.log('📄 [API] mode=all requested - fetching full workout list');
      const workouts = await withApiCache(
        cacheKey,
        getAllWorkouts,
        4 * 60 * 60,
        triggerBackfillAsync // backfill on cache miss, same as page-1 trigger
      );
      return res.status(200).json({ workouts });
    }

    // Legacy paginated path (kept for backwards compatibility)
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const cacheKey = generateCacheKey('workouts-dynamo', { page, pageSize });
    const shouldTriggerBackfill = page === 1;

    const workoutData = await withApiCache(
      cacheKey,
      async () => getWorkoutsPaginated(page, pageSize),
      4 * 60 * 60,
      shouldTriggerBackfill ? triggerBackfillAsync : null
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