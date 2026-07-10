import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../../../lib/dynamo';
import { DYNAMO_TABLES } from '../../../../lib/constants';
import { clearApiCache } from '../../../../lib/apiCache';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    title, rating, gist, password, originalId,
    tmdbId, mediaType, posterPath, tmdbOverview, tmdbDate, skipEditedDate
  } = req.body;

  // Verify password
  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Validate required fields
  if (!title || rating === undefined || !gist || !originalId) {
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
        id: originalId
      }
    };

    const existingReview = await docClient.send(new GetCommand(getParams));
    const originalDate = existingReview.Item?.date;

    // If no original date found, use current date (shouldn't happen for updates)
    const preservedDate = originalDate || new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    // A backfill apply attaches metadata only — it's never a genuine content edit, so it must not
    // stamp editedDate. Preserve whatever editedDate (if any) the record already had instead.
    const editedDate = skipEditedDate
      ? existingReview.Item?.editedDate
      : new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

    // Update the item in place, keyed by the stable id
    const reviewData = {
      id: originalId,
      title,
      rating,
      review_text: gist,
      date: preservedDate,
      ...(editedDate && { editedDate }),
      ...(tmdbId !== undefined && { tmdbId }),
      ...(mediaType !== undefined && { mediaType }),
      ...(posterPath !== undefined && { posterPath }),
      ...(tmdbOverview !== undefined && { tmdbOverview }),
      ...(tmdbDate !== undefined && { tmdbDate }),
    };

    const putParams = {
      TableName: DYNAMO_TABLES.TV_RATINGS_TABLE,
      Item: reviewData
    };

    await docClient.send(new PutCommand(putParams));

    // Clear the cache so updated reviews show up immediately
    clearApiCache('api-tv');

    res.status(200).json({ message: 'Review updated successfully', review: reviewData });
  } catch (error) {
    console.error('Error updating TV review:', error);
    res.status(500).json({ message: 'Error updating review' });
  }
}
