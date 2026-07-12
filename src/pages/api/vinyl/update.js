import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../../lib/dynamo';
import { DYNAMO_TABLES } from '../../../lib/constants';
import { clearApiCache } from '../../../lib/apiCache';
import { pickLargestFromImageMap } from '../../../lib/lastfm';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { title, artist, originalId, password, lastfm } = req.body;

  // Validate password
  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  // Validate required fields
  if (!title || !artist) {
    return res.status(400).json({ message: 'Title and Artist are required fields' });
  }

  if (!originalId) {
    return res.status(400).json({ message: 'Original id is required' });
  }

  try {
    const updateExpressionParts = ['title = :title', 'artist = :artist'];
    const expressionAttributeValues = {
      ':title': title,
      ':artist': artist,
    };

    if (lastfm) {
      updateExpressionParts.push('thumbnail = :thumbnail', 'lastfm = :lastfm');
      expressionAttributeValues[':thumbnail'] = pickLargestFromImageMap(lastfm?.images) || '';
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
      TableName: DYNAMO_TABLES.VINYL_COLLECTION_TABLE,
      Key: {
        id: originalId
      },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(updateParams));

    clearApiCache('api-vinyl-collection');

    res.status(200).json({
      message: 'Vinyl record updated successfully',
      vinyl: result.Attributes
    });
  } catch (error) {
    console.error('Error updating vinyl record:', error);
    res.status(500).json({ message: 'Error updating vinyl record' });
  }
}
