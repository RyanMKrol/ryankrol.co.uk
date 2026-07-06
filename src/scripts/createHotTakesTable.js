import dotenv from 'dotenv';
import { DynamoDBClient, CreateTableCommand, waitUntilTableExists } from '@aws-sdk/client-dynamodb';

dotenv.config({ path: '.env.local' });

const dynamodb = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function createHotTakesTable() {
  const params = {
    TableName: 'HotTakes',
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH' // Partition key — synthetic randomUUID key
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S'
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  };

  try {
    const result = await dynamodb.send(new CreateTableCommand(params));
    console.log('✅ HotTakes table created successfully:', JSON.stringify(result.TableDescription.TableName, null, 2));
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('⚠️  HotTakes table already exists');
    } else {
      console.error('❌ Error creating HotTakes table:', error);
      throw error;
    }
  }
}

async function waitForTableToBeActive(tableName) {
  console.log(`⏳ Waiting for table ${tableName} to be active...`);

  try {
    await waitUntilTableExists(
      { client: dynamodb, maxWaitTime: 120 },
      { TableName: tableName }
    );
    console.log(`✅ Table ${tableName} is now active`);
  } catch (error) {
    console.error(`❌ Error waiting for table ${tableName}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Creating DynamoDB table for hot takes...\n');

  try {
    await createHotTakesTable();
    await waitForTableToBeActive('HotTakes');

    console.log('\n🎉 Table created successfully!');
    console.log('\nTable schema:');
    console.log('📋 HotTakes table: Primary key = id (synthetic randomUUID key)');

  } catch (error) {
    console.error('❌ Failed to create table:', error);
    process.exit(1);
  }
}

main();
