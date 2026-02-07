import { GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../../../lib/dynamo';
import { DYNAMO_TABLES } from '../../../../lib/constants';
import { clearApiCache } from '../../../../lib/apiCache';

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
    // First get the existing review to preserve the original date
    const getParams = {
      TableName: DYNAMO_TABLES.BOOK_RATINGS_TABLE,
      Key: {
        title: originalTitle,
        author: originalAuthor
      }
    };

    const existingReview = await docClient.send(new GetCommand(getParams));
    const originalDate = existingReview.Item?.date;

    // If no original date found, use current date (shouldn't happen for updates)
    const preservedDate = originalDate || new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

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
      await docClient.send(new DeleteCommand(deleteParams));
    }

    // Create/update the item with preserved original date
    const reviewData = {
      title,
      author,
      rating,
      review_text: overview,
      date: preservedDate
    };

    const putParams = {
      TableName: DYNAMO_TABLES.BOOK_RATINGS_TABLE,
      Item: reviewData
    };

    await docClient.send(new PutCommand(putParams));

    // Clear the cache so updated reviews show up immediately
    clearApiCache('api-books');

    res.status(200).json({ message: 'Review updated successfully', review: reviewData });
  } catch (error) {
    console.error('Error updating book review:', error);
    res.status(500).json({ message: 'Error updating review' });
  }
}
