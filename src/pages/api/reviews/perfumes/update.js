import { GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../../../lib/dynamo';
import { DYNAMO_TABLES } from '../../../../lib/constants';
import { clearApiCache } from '../../../../lib/apiCache';
import {
  validatePerfumeRating,
  validateLongevity,
  validateProjection,
  validateSeasons,
  validateApplicationSpots,
  validateOwnership,
  validateFragranticaUrl,
  perfumeId,
} from '../../../../lib/perfumes';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    originalId,
    title,
    designer,
    type,
    description,
    rating,
    ownership,
    longevity,
    projection,
    seasons,
    applicationSpots,
    fragranticaUrl,
    password,
  } = req.body;

  // Verify password
  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Validate required fields
  if (!title || !designer || !type || rating === undefined || !originalId || !fragranticaUrl) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (!validateFragranticaUrl(fragranticaUrl)) {
    return res.status(400).json({ message: 'Fragrantica URL must be a valid URL' });
  }

  // Validate rating is an integer 0-10
  if (!validatePerfumeRating(rating)) {
    return res.status(400).json({ message: 'Rating must be an integer between 0 and 10' });
  }

  if (longevity !== undefined && !validateLongevity(longevity)) {
    return res.status(400).json({ message: 'Longevity must be an integer between 0 and 8' });
  }

  if (projection !== undefined && !validateProjection(projection)) {
    return res.status(400).json({ message: 'Projection must be an integer between 1 and 4' });
  }

  if (seasons !== undefined && !validateSeasons(seasons)) {
    return res.status(400).json({ message: 'Seasons must be an array of valid season values' });
  }

  if (applicationSpots !== undefined && !validateApplicationSpots(applicationSpots)) {
    return res
      .status(400)
      .json({ message: 'Application spots must be an array of valid application spot values' });
  }

  if (ownership !== undefined && !validateOwnership(ownership)) {
    return res
      .status(400)
      .json({ message: "Ownership must be one of 'Sample', 'Travel size', 'Full bottle'" });
  }

  try {
    const getParams = {
      TableName: DYNAMO_TABLES.PERFUME_RATINGS_TABLE,
      Key: {
        id: originalId,
      },
    };

    const existingReview = await docClient.send(new GetCommand(getParams));
    const originalDate = existingReview.Item?.date;

    // If no original date found, use current date (shouldn't happen for updates)
    const preservedDate = originalDate || new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const editedDate = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

    const id = perfumeId({ title, designer, type });
    const idChanged = id !== originalId;

    if (idChanged) {
      const deleteParams = {
        TableName: DYNAMO_TABLES.PERFUME_RATINGS_TABLE,
        Key: {
          id: originalId,
        },
      };
      await docClient.send(new DeleteCommand(deleteParams));
    }

    const reviewData = {
      id,
      title,
      designer,
      type,
      description,
      rating,
      fragranticaUrl,
      ...(ownership !== undefined && { ownership }),
      ...(longevity !== undefined && { longevity }),
      ...(projection !== undefined && { projection }),
      ...(seasons !== undefined && { seasons }),
      ...(applicationSpots !== undefined && { applicationSpots }),
      date: preservedDate,
      editedDate,
    };

    const putParams = {
      TableName: DYNAMO_TABLES.PERFUME_RATINGS_TABLE,
      Item: reviewData,
    };

    await docClient.send(new PutCommand(putParams));

    // Clear the cache so updated reviews show up immediately
    clearApiCache('api-perfumes');

    res.status(200).json({ message: 'Review updated successfully', review: reviewData });
  } catch (error) {
    console.error('Error updating perfume review:', error);
    res.status(500).json({ message: 'Error updating review' });
  }
}
