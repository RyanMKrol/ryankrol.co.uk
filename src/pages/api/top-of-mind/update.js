import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../../lib/dynamo';
import { DYNAMO_TABLES } from '../../../lib/constants';
import { clearApiCache } from '../../../lib/apiCache';
import { validateTopOfMindText } from '../../../lib/topOfMind';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { text, password } = req.body;

  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  if (!validateTopOfMindText(text)) {
    return res.status(400).json({ message: 'A non-empty note under 20000 characters is required' });
  }

  try {
    const topOfMindData = {
      id: 'top-of-mind',
      text,
      updatedAt: new Date().toISOString(),
    };

    const params = {
      TableName: DYNAMO_TABLES.TOP_OF_MIND_TABLE,
      Item: topOfMindData,
    };

    await docClient.send(new PutCommand(params));

    clearApiCache('api-top-of-mind');

    res.status(200).json({
      message: 'Top of mind note saved successfully',
      text: topOfMindData.text,
      updatedAt: topOfMindData.updatedAt,
    });
  } catch (error) {
    console.error('Error saving top of mind note:', error);
    res.status(500).json({ message: 'Error saving top of mind note' });
  }
}
