import { withApiCache, generateCacheKey } from '../../../../lib/apiCache';
import { getExerciseHistory } from '../../../../lib/workoutQueries';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { exerciseName } = req.query;
    const limit = parseInt(req.query.limit) || 50;
    
    if (!exerciseName) {
      return res.status(400).json({ message: 'Exercise name is required' });
    }
    
    // Generate cache key for this exercise history
    const cacheKey = generateCacheKey('exercise-history', { exerciseName, limit });
    
    // Use mandatory caching wrapper
    const history = await withApiCache(cacheKey, async () => {
      return await getExerciseHistory(decodeURIComponent(exerciseName), limit);
    });
    
    res.status(200).json({ 
      exerciseName: decodeURIComponent(exerciseName),
      limit,
      history: history || [] 
    });
  } catch (error) {
    console.error(`Error fetching history for exercise ${req.query.exerciseName}:`, error);
    res.status(500).json({ 
      message: 'Error fetching exercise history',
      error: error.message 
    });
  }
}