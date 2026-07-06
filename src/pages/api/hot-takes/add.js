import { randomUUID } from 'crypto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../../lib/dynamo';
import { DYNAMO_TABLES } from '../../../lib/constants';
import { clearApiCache } from '../../../lib/apiCache';
import { validateHotTakeText } from '../../../lib/hotTakes';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { text, password } = req.body;

  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  if (!validateHotTakeText(text)) {
    return res.status(400).json({ message: 'A non-empty take under 500 characters is required' });
  }

  try {
    const hotTakeData = {
      id: randomUUID(),
      text,
      date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
    };

    const params = {
      TableName: DYNAMO_TABLES.HOT_TAKES_TABLE,
      Item: hotTakeData
    };

    await docClient.send(new PutCommand(params));

    clearApiCache('api-hot-takes');

    res.status(201).json({
      message: 'Hot take added successfully',
      hotTake: hotTakeData
    });
  } catch (error) {
    console.error('Error adding hot take:', error);
    res.status(500).json({ message: 'Error adding hot take' });
  }
}
