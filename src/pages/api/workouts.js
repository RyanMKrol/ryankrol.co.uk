import { withApiCache, generateCacheKey } from '../../lib/apiCache';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const HEVY_API_KEY = process.env.HEVY_API_KEY;
    
    if (!HEVY_API_KEY) {
      return res.status(500).json({ 
        message: 'Hevy API key not configured',
        error: 'Missing HEVY_API_KEY environment variable'
      });
    }

    // Get pagination parameters
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 10;
    
    // Generate cache key for this specific request
    const cacheKey = generateCacheKey('workouts', { page, pageSize });
    
    // Use mandatory caching wrapper
    const workoutData = await withApiCache(cacheKey, async () => {
      const endpoint = `https://api.hevyapp.com/v1/workouts?page=${page}&pageSize=${pageSize}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api-key': HEVY_API_KEY,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Hevy API error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch workouts from Hevy API: ${errorText}`);
      }

      return await response.json();
    });
    
    res.status(200).json(workoutData);
  } catch (error) {
    console.error('Error fetching workouts from Hevy:', error);
    res.status(500).json({ 
      message: 'Error fetching workouts',
      error: error.message 
    });
  }
}