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

  const { title, author, rating, overview, password, originalTitle, originalAuthor } = req.body;

  // Verify password
  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Validate required fields
  if (!title || !author || rating === undefined || !overview || !originalTitle || !originalAuthor) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Validate rating is between 0-5
  if (rating < 0 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 0 and 5' });
  }

  try {
    // If title or author changed, we need to delete the old item and create a new one
    // If only other fields changed, we can update in place
    const titleChanged = title !== originalTitle;
    const authorChanged = author !== originalAuthor;
    
    if (titleChanged || authorChanged) {
      // Delete the old item
      const deleteParams = {
        TableName: DYNAMO_TABLES.BOOK_RATINGS_TABLE,
        Key: {
          title: originalTitle,
          author: originalAuthor
        }
      };
      await dynamoDb.delete(deleteParams).promise();
    }

    // Create/update the item with new data
    const now = new Date();
    const dateString = now.toLocaleDateString('en-GB').replace(/\//g, '-');
    
    const reviewData = {
      title,
      author,
      rating,
      review_text: overview,
      date: dateString
    };

    const putParams = {
      TableName: DYNAMO_TABLES.BOOK_RATINGS_TABLE,
      Item: reviewData
    };

    await dynamoDb.put(putParams).promise();

    // Clear the cache so updated reviews show up immediately
    SERVER_CACHES.BOOK_CACHE.del('books');

    res.status(200).json({ message: 'Review updated successfully', review: reviewData });
  } catch (error) {
    console.error('Error updating book review:', error);
    res.status(500).json({ message: 'Error updating review' });
  }
}