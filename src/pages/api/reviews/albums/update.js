import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../../../lib/dynamo';
import { DYNAMO_TABLES } from '../../../../lib/constants';
import { clearApiCache } from '../../../../lib/apiCache';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { title, artist, rating, highlights, originalId, password, lastfm } = req.body;

  // Validate password
  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  // Validate required fields
  if (!title || !artist || rating === undefined || !highlights) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Validate originalId for finding the record
  if (!originalId) {
    return res.status(400).json({ message: 'Original id is required' });
  }

  try {
    // Update the item in DynamoDB
    const updateExpressionParts = ['#rating = :rating', 'highlights = :highlights'];
    const expressionAttributeNames = { '#rating': 'rating' };
    const expressionAttributeValues = {
      ':rating': Number(rating),
      ':highlights': highlights
    };

    if (lastfm) {
      updateExpressionParts.push('thumbnail = :thumbnail', 'lastfm = :lastfm');
      expressionAttributeValues[':thumbnail'] = lastfm?.images?.[lastfm.images.length - 1]?.['#text'] || '';
      expressionAttributeValues[':lastfm'] = {
        mbid: lastfm.mbid || '',
        url: lastfm.url || '',
        listeners: lastfm.listeners || '',
        playcount: lastfm.playcount || '',
        tags: lastfm.tags || [],
        trackCount: lastfm.trackCount || 0,
        summary: lastfm.summary || '',
        releaseDate: lastfm.releaseDate || '',
        images: lastfm.images || []
      };
    }

    const updateParams = {
      TableName: DYNAMO_TABLES.ALBUM_RATINGS_TABLE,
      Key: {
        id: originalId
      },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(updateParams));

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
