import './_env.js';
import { storeWorkoutInDynamoDB } from '../lib/workoutBackfill.js';

// Rate limiting helper - 100ms between calls
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAllWorkoutsFromHevy() {
  const HEVY_API_KEY = process.env.HEVY_API_KEY;

  if (!HEVY_API_KEY) {
    throw new Error('HEVY_API_KEY environment variable not found');
  }

  console.log('📡 Starting to fetch all workouts from Hevy API...');

  let allWorkouts = [];
  let page = 1;
  let hasMorePages = true;
  const pageSize = 10; // Max page size for Hevy API

  while (hasMorePages) {
    console.log(`📄 Fetching page ${page}...`);

    try {
      const response = await fetch(
        `https://api.hevyapp.com/v1/workouts?page=${page}&pageSize=${pageSize}`,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'api-key': HEVY_API_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Hevy API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      console.log(`   ✅ Got ${data.workouts?.length || 0} workouts (page ${data.page} of ${data.page_count})`);

      if (data.workouts && data.workouts.length > 0) {
        allWorkouts.push(...data.workouts);
      }

      // Check if there are more pages
      hasMorePages = data.page < data.page_count;
      page++;

      // Rate limiting - wait 100ms between requests
      await sleep(100);

    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error);
      throw error;
    }
  }

  console.log(`🎉 Successfully fetched ${allWorkouts.length} total workouts from Hevy\n`);
  return allWorkouts;
}

async function migrateWorkoutData(workouts) {
  console.log(`💾 Starting to store ${workouts.length} workouts in DynamoDB...\n`);

  let workoutsProcessed = 0;

  for (let i = 0; i < workouts.length; i++) {
    const workout = workouts[i];
    console.log(`📝 Processing workout ${i + 1}/${workouts.length}: "${workout.title}" (${workout.id})`);

    try {
      await storeWorkoutInDynamoDB(workout);
      workoutsProcessed++;
      console.log(`   ✅ Processed workout with ${workout.exercises.length} exercises`);
    } catch (error) {
      console.error(`   ❌ Error processing workout ${workout.id}:`, error);
    }
  }

  console.log('\n🎉 Migration completed!');
  console.log(`📊 Summary: ${workoutsProcessed}/${workouts.length} workouts processed`);
}

export { migrateWorkoutData };

async function main() {
  console.log('🚀 Starting workout data migration from Hevy to DynamoDB...\n');

  try {
    // Fetch all workouts from Hevy API
    const workouts = await fetchAllWorkoutsFromHevy();

    if (workouts.length === 0) {
      console.log('⚠️  No workouts found, nothing to migrate');
      return;
    }

    // Store all workouts and exercises in DynamoDB
    await migrateWorkoutData(workouts);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  main();
}
