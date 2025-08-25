import { DYNAMO_TABLES } from '../../../../lib/constants';
import { clearApiCache } from '../../../../lib/apiCache';
import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { title, author, password } = req.body;

  // Verify password
  if (password !== process.env.RYANKROL_SITE_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Validate required fields
  if (!title || !author) {
    return res.status(400).json({ message: 'Missing required fields (title and author)' });
  }

  try {
    const params = {
      TableName: DYNAMO_TABLES.BOOK_RATINGS_TABLE,
      Key: {
        title,
        author
      }
    };

    await dynamoDb.delete(params).promise();

    // Clear the cache so deleted reviews are removed immediately
    clearApiCache('api-books');

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting book review:', error);
    res.status(500).json({ message: 'Error deleting review' });
  }
}