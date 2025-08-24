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
      return res.status(response.status).json({ 
        message: 'Failed to fetch workouts from Hevy API',
        error: errorText,
        status: response.status
      });
    }

    const workoutData = await response.json();
    
    res.status(200).json(workoutData);
  } catch (error) {
    console.error('Error fetching workouts from Hevy:', error);
    res.status(500).json({ 
      message: 'Error fetching workouts',
      error: error.message 
    });
  }
}