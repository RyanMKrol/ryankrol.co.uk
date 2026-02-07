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

async function createWorkoutsTable() {
  const params = {
    TableName: 'Workouts',
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH' // Partition key
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S'
      },
      {
        AttributeName: 'start_time',
        AttributeType: 'S'
      }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'start_time-index',
        KeySchema: [
          {
            AttributeName: 'start_time',
            KeyType: 'HASH'
          }
        ],
        Projection: {
          ProjectionType: 'ALL'
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  };

  try {
    const result = await dynamodb.send(new CreateTableCommand(params));
    console.log('✅ Workouts table created successfully:', JSON.stringify(result.TableDescription.TableName, null, 2));
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('⚠️  Workouts table already exists');
    } else {
      console.error('❌ Error creating Workouts table:', error);
      throw error;
    }
  }
}

async function createExercisesTable() {
  const params = {
    TableName: 'Exercises',
    KeySchema: [
      {
        AttributeName: 'exercise_id',
        KeyType: 'HASH' // Partition key
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'exercise_id',
        AttributeType: 'S'
      },
      {
        AttributeName: 'workout_id',
        AttributeType: 'S'
      },
      {
        AttributeName: 'exercise_name',
        AttributeType: 'S'
      },
      {
        AttributeName: 'workout_date',
        AttributeType: 'S'
      }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'workout_id-index',
        KeySchema: [
          {
            AttributeName: 'workout_id',
            KeyType: 'HASH'
          }
        ],
        Projection: {
          ProjectionType: 'ALL'
        }
      },
      {
        IndexName: 'exercise_name-workout_date-index',
        KeySchema: [
          {
            AttributeName: 'exercise_name',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'workout_date',
            KeyType: 'RANGE'
          }
        ],
        Projection: {
          ProjectionType: 'ALL'
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  };

  try {
    const result = await dynamodb.send(new CreateTableCommand(params));
    console.log('✅ Exercises table created successfully:', JSON.stringify(result.TableDescription.TableName, null, 2));
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('⚠️  Exercises table already exists');
    } else {
      console.error('❌ Error creating Exercises table:', error);
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
  console.log('🚀 Creating DynamoDB tables for workout data...\n');

  try {
    // Create both tables
    await createWorkoutsTable();
    await createExercisesTable();

    // Wait for tables to be active
    await waitForTableToBeActive('Workouts');
    await waitForTableToBeActive('Exercises');

    console.log('\n🎉 All tables created successfully!');
    console.log('\nTable schemas:');
    console.log('📋 Workouts table: Primary key = id (workout ID from Hevy)');
    console.log('   - GSI: start_time-index for chronological queries');
    console.log('📋 Exercises table: Primary key = exercise_id (workout_id + exercise_index)');
    console.log('   - GSI: workout_id-index for querying all exercises in a workout');
    console.log('   - GSI: exercise_name-workout_date-index for exercise history queries');

  } catch (error) {
    console.error('❌ Failed to create tables:', error);
    process.exit(1);
  }
}

main();
