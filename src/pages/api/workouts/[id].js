import { withApiCache, generateCacheKey } from '../../../lib/apiCache';
import { getWorkoutById } from '../../../lib/workoutQueries';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ message: 'Workout ID is required' });
    }
    
    // Generate cache key for this specific workout
    const cacheKey = generateCacheKey('workout', { id });
    
    // Use mandatory caching wrapper
    const workout = await withApiCache(cacheKey, async () => {
      return await getWorkoutById(id);
    });
    
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }
    
    res.status(200).json(workout);
  } catch (error) {
    console.error(`Error fetching workout ${req.query.id}:`, error);
    res.status(500).json({ 
      message: 'Error fetching workout',
      error: error.message 
    });
  }
}