import { backfillWorkouts } from '../../../lib/workoutBackfill';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed. Use POST to trigger backfill.' });
  }

  try {
    console.log('🚀 Manual backfill triggered via API');
    const result = await backfillWorkouts();
    
    res.status(200).json({
      success: true,
      message: 'Backfill completed successfully',
      ...result
    });
    
  } catch (error) {
    console.error('Error during manual backfill:', error);
    res.status(500).json({ 
      success: false,
      message: 'Backfill failed',
      error: error.message 
    });
  }
}