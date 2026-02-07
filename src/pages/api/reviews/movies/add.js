import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../../../lib/dynamo';
import { DYNAMO_TABLES } from '../../../../lib/constants';
import { clearApiCache } from '../../../../lib/apiCache';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { title, rating, gist, password } = req.body;

  // Verify password
  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Validate required fields
  if (!title || rating === undefined || !gist) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Validate rating is between 0-5
  if (rating < 0 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 0 and 5' });
  }

  try {
    const now = new Date();
    const dateString = now.toLocaleDateString('en-GB').replace(/\//g, '-');

    const reviewData = {
      title,
      rating,
      review_text: gist,
      date: dateString
    };

    const params = {
      TableName: DYNAMO_TABLES.MOVIE_RATINGS_TABLE,
      Item: reviewData
    };

    await docClient.send(new PutCommand(params));

    // Clear the cache so new reviews show up immediately
    clearApiCache('api-movies');

    res.status(201).json({ message: 'Review added successfully', review: reviewData });
  } catch (error) {
    console.error('Error adding movie review:', error);
    res.status(500).json({ message: 'Error adding review' });
  }
}
