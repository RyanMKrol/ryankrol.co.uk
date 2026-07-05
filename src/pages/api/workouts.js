import { withApiCache, generateCacheKey } from '../../lib/apiCache';
import { getAllWorkouts } from '../../lib/workoutQueries';
import { triggerBackfillAsync } from '../../lib/workoutBackfill';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const cacheKey = generateCacheKey('workouts-dynamo-all');
    console.log('📄 [API] mode=all requested - fetching full workout list');
    const workouts = await withApiCache(
      cacheKey,
      getAllWorkouts,
      4 * 60 * 60,
      triggerBackfillAsync // backfill on cache miss, same as page-1 trigger
    );
    return res.status(200).json({ workouts });
  } catch (error) {
    console.error('Error fetching workouts from DynamoDB:', error);
    res.status(500).json({
      message: 'Error fetching workouts',
      error: error.message
    });
  }
}