import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../../lib/dynamo';
import { DYNAMO_TABLES } from '../../../lib/constants';
import { clearApiCache } from '../../../lib/apiCache';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id, password } = req.body;

  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  if (!id) {
    return res.status(400).json({ message: 'Missing required field (id)' });
  }

  try {
    const params = {
      TableName: DYNAMO_TABLES.HOT_TAKES_TABLE,
      Key: { id },
    };

    await docClient.send(new DeleteCommand(params));

    clearApiCache('api-hot-takes');

    res.status(200).json({ message: 'Hot take deleted successfully' });
  } catch (error) {
    console.error('Error deleting hot take:', error);
    res.status(500).json({ message: 'Error deleting hot take' });
  }
}
