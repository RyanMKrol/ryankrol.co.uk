import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../../lib/dynamo';
import { DYNAMO_TABLES } from '../../../lib/constants';
import { withApiCache, generateCacheKey } from '../../../lib/apiCache';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const cacheKey = generateCacheKey('top-of-mind');

    const topOfMind = await withApiCache(cacheKey, async () => {
      const params = {
        TableName: DYNAMO_TABLES.TOP_OF_MIND_TABLE,
        Key: { id: 'top-of-mind' },
      };

      const result = await docClient.send(new GetCommand(params));
      return result.Item || {};
    });

    res.status(200).json(topOfMind);
  } catch (error) {
    console.error('Error fetching top of mind note:', error);
    res.status(500).json({ message: 'Error fetching top of mind note' });
  }
}
