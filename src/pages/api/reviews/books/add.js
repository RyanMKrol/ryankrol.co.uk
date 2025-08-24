import { DYNAMO_TABLES, SERVER_CACHES } from '../../../../lib/constants';
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

  const { title, author, rating, overview, password } = req.body;

  // Verify password
  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Validate required fields
  if (!title || !author || rating === undefined || !overview) {
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
      author,
      rating,
      review_text: overview,
      date: dateString
    };

    const params = {
      TableName: DYNAMO_TABLES.BOOK_RATINGS_TABLE,
      Item: reviewData
    };

    await dynamoDb.put(params).promise();

    // Clear the cache so new reviews show up immediately
    SERVER_CACHES.BOOK_CACHE.del('books');

    res.status(201).json({ message: 'Review added successfully', review: reviewData });
  } catch (error) {
    console.error('Error adding book review:', error);
    res.status(500).json({ message: 'Error adding review' });
  }
}