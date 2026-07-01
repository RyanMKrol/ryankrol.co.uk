import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../../../lib/dynamo';
import { DYNAMO_TABLES } from '../../../../lib/constants';
import { clearApiCache } from '../../../../lib/apiCache';
import { validatePerfumeRating, perfumeId } from '../../../../lib/perfumes';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    title,
    designer,
    type,
    description,
    rating,
    notes,
    considerTravelSize,
    considerFullBottle,
    password,
  } = req.body;

  // Verify password
  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Validate required fields
  if (!title || !designer || !type || rating === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Validate rating is an integer 0-10
  if (!validatePerfumeRating(rating)) {
    return res.status(400).json({ message: 'Rating must be an integer between 0 and 10' });
  }

  try {
    const now = new Date();
    const dateString = now.toLocaleDateString('en-GB').replace(/\//g, '-');

    const reviewData = {
      id: perfumeId({ title, designer, type }),
      title,
      designer,
      type,
      description,
      rating,
      notes,
      considerTravelSize,
      considerFullBottle,
      date: dateString,
    };

    const params = {
      TableName: DYNAMO_TABLES.PERFUME_RATINGS_TABLE,
      Item: reviewData,
    };

    await docClient.send(new PutCommand(params));

    // Clear the cache so new reviews show up immediately
    clearApiCache('api-perfumes');

    res.status(201).json({ message: 'Review added successfully', review: reviewData });
  } catch (error) {
    console.error('Error adding perfume review:', error);
    res.status(500).json({ message: 'Error adding review' });
  }
}
