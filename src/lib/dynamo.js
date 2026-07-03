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

/**
 * Build UpdateCommand params that SET every key in `fields` on an item, deriving the
 * UpdateExpression/attribute maps entirely from the object's own keys. Use this instead of
 * hand-listing field names at a write site - a hand-picked field list silently drifts out of
 * sync whenever the source object (e.g. calculateWorkoutMetrics's return shape) gains a new
 * field, which is exactly how workoutDate went missing from healed workout records in 2026-07.
 * @param {string} tableName
 * @param {Object} key Primary key of the item to update
 * @param {Object} fields Plain object of attribute name -> value to SET
 * @returns {Object} Params ready to pass to `new UpdateCommand(...)`
 */
function buildSetUpdateParams(tableName, key, fields) {
  const entries = Object.entries(fields);
  const ExpressionAttributeNames = {};
  const ExpressionAttributeValues = {};

  const setClauses = entries.map(([field, value], i) => {
    const nameKey = `#f${i}`;
    const valueKey = `:v${i}`;
    ExpressionAttributeNames[nameKey] = field;
    ExpressionAttributeValues[valueKey] = value;
    return `${nameKey} = ${valueKey}`;
  });

  return {
    TableName: tableName,
    Key: key,
    UpdateExpression: `SET ${setClauses.join(', ')}`,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  };
}

export { paginatedScan, scanTable, buildSetUpdateParams, docClient, dynamoClient };
