import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * Paginated scan that loops on LastEvaluatedKey so results are never
 * silently truncated at the 1 MB DynamoDB response limit.
 * @param {Object} params ScanCommand parameters (TableName, FilterExpression, etc.)
 * @returns {Array} All matching items across every page
 */
async function paginatedScan(params) {
  let allItems = [];
  let lastKey;
  do {
    const result = await docClient.send(
      new ScanCommand({ ...params, ExclusiveStartKey: lastKey })
    );
    allItems.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);
  return allItems;
}

/**
 * Method to scan a table in Dynamo
 * @param {string} table The table to scan data from
 * @returns {any} Data from the table
 */
async function scanTable(table) {
  return paginatedScan({ TableName: table });
}

export { paginatedScan, scanTable, docClient, dynamoClient };
