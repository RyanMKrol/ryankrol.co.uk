import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../../../lib/dynamo';
import { DYNAMO_TABLES } from '../../../../lib/constants';
import { clearApiCache } from '../../../../lib/apiCache';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    title, author, rating, overview, password, originalId,
    source, olid, coverId, coverUrl, volumeId,
    bookAuthors, firstPublishedYear, isbn, subjects, pageCount, publisher
  } = req.body;

  // Verify password
  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Validate required fields
  if (!title || !author || rating === undefined || !overview || !originalId) {
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
        id: originalId
      }
    };

    const existingReview = await docClient.send(new GetCommand(getParams));
    const originalDate = existingReview.Item?.date;

    // If no original date found, use current date (shouldn't happen for updates)
    const preservedDate = originalDate || new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

    // Update the item in place with preserved original date and id
    const reviewData = {
      id: originalId,
      title,
      author,
      rating,
      review_text: overview,
      date: preservedDate,
      ...(source !== undefined && { source }),
      ...(olid !== undefined && { olid }),
      ...(coverId !== undefined && { coverId }),
      ...(coverUrl !== undefined && { coverUrl }),
      ...(volumeId !== undefined && { volumeId }),
      ...(bookAuthors !== undefined && { bookAuthors }),
      ...(firstPublishedYear !== undefined && { firstPublishedYear }),
      ...(isbn !== undefined && { isbn }),
      ...(subjects !== undefined && { subjects }),
      ...(pageCount !== undefined && { pageCount }),
      ...(publisher !== undefined && { publisher }),
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
