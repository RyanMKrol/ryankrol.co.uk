import { DYNAMO_TABLES } from '../../../../lib/constants';
import { clearApiCache } from '../../../../lib/apiCache';
import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { title, rating, gist, password, originalTitle } = req.body;

  // Verify password
  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Validate required fields
  if (!title || rating === undefined || !gist || !originalTitle) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Validate rating is between 0-5
  if (rating < 0 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 0 and 5' });
  }

  try {
    // First get the existing review to preserve the original date
    const getParams = {
      TableName: DYNAMO_TABLES.TV_RATINGS_TABLE,
      Key: {
        title: originalTitle
      }
    };
    
    const existingReview = await dynamoDb.get(getParams).promise();
    const originalDate = existingReview.Item?.date;
    
    // If no original date found, use current date (shouldn't happen for updates)
    const preservedDate = originalDate || new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    
    // If title changed, we need to delete the old item and create a new one
    const titleChanged = title !== originalTitle;
    
    if (titleChanged) {
      // Delete the old item
      const deleteParams = {
        TableName: DYNAMO_TABLES.TV_RATINGS_TABLE,
        Key: {
          title: originalTitle
        }
      };
      await dynamoDb.delete(deleteParams).promise();
    }

    // Create/update the item with preserved original date
    const reviewData = {
      title,
      rating,
      review_text: gist,
      date: preservedDate
    };

    const putParams = {
      TableName: DYNAMO_TABLES.TV_RATINGS_TABLE,
      Item: reviewData
    };

    await dynamoDb.put(putParams).promise();

    // Clear the cache so updated reviews show up immediately
    clearApiCache('api-tv');

    res.status(200).json({ message: 'Review updated successfully', review: reviewData });
  } catch (error) {
    console.error('Error updating TV review:', error);
    res.status(500).json({ message: 'Error updating review' });
  }
}