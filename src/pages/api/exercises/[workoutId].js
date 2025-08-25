import { withApiCache, generateCacheKey } from '../../../lib/apiCache';
import { getExercisesByWorkout } from '../../../lib/workoutQueries';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { workoutId } = req.query;
    
    if (!workoutId) {
      return res.status(400).json({ message: 'Workout ID is required' });
    }
    
    // Generate cache key for this workout's exercises
    const cacheKey = generateCacheKey('workout-exercises', { workoutId });
    
    // Use mandatory caching wrapper
    const exercises = await withApiCache(cacheKey, async () => {
      return await getExercisesByWorkout(workoutId);
    });
    
    res.status(200).json({ 
      workoutId,
      exercises: exercises || [] 
    });
  } catch (error) {
    console.error(`Error fetching exercises for workout ${req.query.workoutId}:`, error);
    res.status(500).json({ 
      message: 'Error fetching exercises',
      error: error.message 
    });
  }
}