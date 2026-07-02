import { randomUUID } from 'crypto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../../../lib/dynamo';
import { DYNAMO_TABLES } from '../../../../lib/constants';
import { clearApiCache } from '../../../../lib/apiCache';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { title, artist, rating, highlights, password, lastfm } = req.body;

  // Validate password
  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  // Validate required fields
  if (!title || !artist || rating === undefined || !highlights || !lastfm) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const albumData = {
      id: randomUUID(),
      title,
      artist,
      rating: Number(rating),
      highlights,
      date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      thumbnail: lastfm?.images?.[lastfm.images.length - 1]?.['#text'] || ''
    };

    if (lastfm) {
      albumData.lastfm = {
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

    const params = {
      TableName: DYNAMO_TABLES.ALBUM_RATINGS_TABLE,
      Item: albumData
    };

    await docClient.send(new PutCommand(params));

    clearApiCache('api-albums');

    res.status(201).json({
      message: 'Album review added successfully',
      album: albumData
    });
  } catch (error) {
    console.error('Error adding album review:', error);
    res.status(500).json({ message: 'Error adding album review' });
  }
}
