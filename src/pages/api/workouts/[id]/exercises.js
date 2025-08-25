import { withApiCache, generateCacheKey } from '../../../../lib/apiCache';
import { getExercisesByWorkout } from '../../../../lib/workoutQueries';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ message: 'Workout ID is required' });
    }
    
    // Generate cache key for this workout's exercises
    const cacheKey = generateCacheKey('workout-exercises', { workoutId: id });
    
    // Use mandatory caching wrapper
    const exercises = await withApiCache(cacheKey, async () => {
      return await getExercisesByWorkout(id);
    });
    
    res.status(200).json({ 
      workoutId: id,
      exercises: exercises || [] 
    });
  } catch (error) {
    console.error(`Error fetching exercises for workout ${req.query.id}:`, error);
    res.status(500).json({ 
      message: 'Error fetching workout exercises',
      error: error.message 
    });
  }
}