import AWS from 'aws-sdk';

const CREDENTIALS = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

const DYNAMO_REGION = 'us-east-2';

AWS.config.update({
  region: DYNAMO_REGION,
  credentials: CREDENTIALS
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * Method to scan a table in Dynamo
 * @param {string} table The table to scan data from
 * @returns {any} Data from the table
 */
async function scanTable(table) {
  const params = {
    TableName: table
  };
  
  const result = await dynamodb.scan(params).promise();
  return result.Items;
}

export { scanTable };