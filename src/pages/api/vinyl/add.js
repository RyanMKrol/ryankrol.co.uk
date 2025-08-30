import AWS from 'aws-sdk';
import { DYNAMO_TABLES } from '../../../lib/constants';
import { clearApiCache } from '../../../lib/apiCache';

// Configure AWS
AWS.config.update({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();

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

    await dynamoDb.put(params).promise();
    
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