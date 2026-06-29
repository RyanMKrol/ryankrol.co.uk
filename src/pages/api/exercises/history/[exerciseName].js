import { withApiCache, generateCacheKey } from '../../../../lib/apiCache';
import { getExerciseHistory } from '../../../../lib/workoutQueries';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { exerciseName } = req.query;

    if (!exerciseName) {
      return res.status(400).json({ message: 'Exercise name is required' });
    }

    const cacheKey = generateCacheKey('exercise-history', { exerciseName });

    const history = await withApiCache(cacheKey, async () => {
      return await getExerciseHistory(decodeURIComponent(exerciseName));
    });

    res.status(200).json({
      exerciseName: decodeURIComponent(exerciseName),
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
