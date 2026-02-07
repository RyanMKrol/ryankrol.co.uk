import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../../lib/dynamo';
import { DYNAMO_TABLES } from '../../../lib/constants';
import { clearApiCache } from '../../../lib/apiCache';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { title, artist, password } = req.body;

  // Validate password
  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  // Validate required fields
  if (!title || !artist) {
    return res.status(400).json({ message: 'Title and Artist are required fields' });
  }

  try {
    // Create new vinyl record
    const vinylData = {
      title,
      artist
    };

    const params = {
      TableName: DYNAMO_TABLES.VINYL_COLLECTION_TABLE,
      Item: vinylData
    };

    await docClient.send(new PutCommand(params));

    // Clear the vinyl cache
    clearApiCache('vinyl-collection');

    res.status(201).json({
      message: 'Vinyl record added successfully',
      vinyl: vinylData
    });
  } catch (error) {
    console.error('Error adding vinyl record:', error);
    res.status(500).json({ message: 'Error adding vinyl record' });
  }
}
