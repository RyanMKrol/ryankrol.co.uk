import AWS from 'aws-sdk';
import { DYNAMO_TABLES } from '../../../../lib/constants';
import { clearApiCache } from '../../../../lib/apiCache';

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

  const { title, artist, rating, highlights, originalTitle, originalArtist, password } = req.body;

  // Validate password
  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  // Validate required fields
  if (!title || !artist || rating === undefined || !highlights) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Validate originalTitle and originalArtist for finding the record
  if (!originalTitle || !originalArtist) {
    return res.status(400).json({ message: 'Original title and artist are required' });
  }

  try {
    // Update the item in DynamoDB
    const updateParams = {
      TableName: DYNAMO_TABLES.ALBUM_RATINGS_TABLE,
      Key: {
        title: originalTitle,
        artist: originalArtist
      },
      UpdateExpression: 'SET #rating = :rating, highlights = :highlights',
      ExpressionAttributeNames: {
        '#rating': 'rating'
      },
      ExpressionAttributeValues: {
        ':rating': Number(rating),
        ':highlights': highlights
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamoDb.update(updateParams).promise();
    
    // Clear the cache
    clearApiCache('api-albums');
    
    res.status(200).json({ 
      message: 'Album review updated successfully',
      album: result.Attributes
    });
  } catch (error) {
    console.error('Error updating album review:', error);
    res.status(500).json({ message: 'Error updating album review' });
  }
}