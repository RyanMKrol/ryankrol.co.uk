import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../../lib/dynamo';
import { DYNAMO_TABLES } from '../../../lib/constants';
import { clearApiCache } from '../../../lib/apiCache';
import { validateHotTakeText } from '../../../lib/hotTakes';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id, text, password } = req.body;

  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  if (!validateHotTakeText(text)) {
    return res.status(400).json({ message: 'A non-empty take under 500 characters is required' });
  }

  try {
    const getParams = {
      TableName: DYNAMO_TABLES.HOT_TAKES_TABLE,
      Key: { id },
    };

    const existing = await docClient.send(new GetCommand(getParams));
    const preservedDate = existing.Item?.date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

    const hotTakeData = {
      id,
      text,
      date: preservedDate,
    };

    const putParams = {
      TableName: DYNAMO_TABLES.HOT_TAKES_TABLE,
      Item: hotTakeData,
    };

    await docClient.send(new PutCommand(putParams));

    clearApiCache('api-hot-takes');

    res.status(200).json({
      message: 'Hot take updated successfully',
      hotTake: hotTakeData,
    });
  } catch (error) {
    console.error('Error updating hot take:', error);
    res.status(500).json({ message: 'Error updating hot take' });
  }
}
