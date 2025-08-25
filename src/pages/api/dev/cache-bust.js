import { clearApiCache, getCacheStats } from '../../../lib/apiCache';

export default async function handler(req, res) {
  // Check for password in query params or request body
  const password = req.query.password || req.body?.password;
  
  // Skip password check for localhost in development
  const isLocalhost = req.headers.host && (
    req.headers.host.startsWith('localhost') || 
    req.headers.host.startsWith('127.0.0.1')
  );
  
  if (!isLocalhost && password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  if (isLocalhost) {
    console.log('🏠 [DEV] Localhost detected, skipping password authentication');
  }

  if (req.method === 'POST') {
    try {
      // Clear all caches
      clearApiCache();
      
      // Get updated stats
      const stats = getCacheStats();
      
      res.status(200).json({ 
        message: 'All caches cleared',
        stats 
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ 
        message: 'Error clearing cache',
        error: error.message 
      });
    }
  } else if (req.method === 'GET') {
    // Return current cache stats
    try {
      const stats = getCacheStats();
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error getting cache stats:', error);
      res.status(500).json({ 
        message: 'Error getting cache stats',
        error: error.message 
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}