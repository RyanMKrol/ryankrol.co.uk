import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../../../lib/dynamo';
import { DYNAMO_TABLES } from '../../../../lib/constants';
import { clearApiCache } from '../../../../lib/apiCache';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { title, artist, password } = req.body;

  // Verify password
  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Validate required fields
  if (!title || !artist) {
    return res.status(400).json({ message: 'Missing required fields (title and artist)' });
  }

  try {
    const params = {
      TableName: DYNAMO_TABLES.ALBUM_RATINGS_TABLE,
      Key: {
        title,
        artist
      }
    };

    await docClient.send(new DeleteCommand(params));

    // Clear the cache so deleted reviews are removed immediately
    clearApiCache('api-albums');

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting album review:', error);
    res.status(500).json({ message: 'Error deleting review' });
  }
}
