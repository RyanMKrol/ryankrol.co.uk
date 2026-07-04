import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, paginatedScan } from './dynamo.js';
import { DYNAMO_TABLES } from './constants.js';

/**
 * Get paginated workouts from DynamoDB, sorted by start_time descending
 * @param {number} page - Page number (1-based)
 * @param {number} pageSize - Number of items per page
 * @returns {Object} Paginated workout results
 */
export async function getWorkoutsPaginated(page = 1, pageSize = 10) {
  try {
    console.log(`🗄️  [DYNAMO] Scanning workouts table for pagination (page ${page}, size ${pageSize})`);

    // First, get all workouts to sort them properly
    // Note: DynamoDB doesn't support sorting on non-key attributes without scanning
    const scanParams = {
      TableName: DYNAMO_TABLES.WORKOUTS_TABLE,
      ProjectionExpression: 'id, title, start_time, end_time, totalVolume, totalWorkingSets, totalWarmupSets, uniqueExercises, durationMinutes, workoutType, exercises'
    };

    const startTime = Date.now();
    const allWorkouts = await paginatedScan(scanParams);
    const queryTime = Date.now() - startTime;

    console.log(`🗄️  [DYNAMO] Scan completed: ${allWorkouts.length} workouts found in ${queryTime}ms`);

    // Sort by start_time descending (most recent first)
    allWorkouts.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

    // Calculate pagination
    const totalWorkouts = allWorkouts.length;
    const totalPages = Math.ceil(totalWorkouts / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Get the slice for this page
    const pageWorkouts = allWorkouts.slice(startIndex, endIndex);

    console.log(`📄 [DYNAMO] Returning page ${page}/${totalPages}: ${pageWorkouts.length} workouts`);

    return {
      workouts: pageWorkouts,
      page: parseInt(page),
      page_count: totalPages,
      total_count: totalWorkouts,
      page_size: parseInt(pageSize)
    };

  } catch (error) {
    console.error('❌ [DYNAMO] Error fetching workouts from DynamoDB:', error);
    throw error;
  }
}

/**
 * Get all workouts from DynamoDB, sorted by start_time descending.
 * Used by the workouts page for client-side filter + pagination.
 * @returns {Array} All workout records
 */
export async function getAllWorkouts() {
  try {
    console.log('🗄️  [DYNAMO] Scanning workouts table (all records)');

    const scanParams = {
      TableName: DYNAMO_TABLES.WORKOUTS_TABLE,
      ProjectionExpression: 'id, title, start_time, end_time, totalVolume, totalWorkingSets, totalWarmupSets, uniqueExercises, durationMinutes, workoutType, exercises'
    };

    const startTime = Date.now();
    const allWorkouts = await paginatedScan(scanParams);
    const queryTime = Date.now() - startTime;

    console.log(`🗄️  [DYNAMO] Scan completed: ${allWorkouts.length} workouts in ${queryTime}ms`);

    allWorkouts.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

    return allWorkouts;
  } catch (error) {
    console.error('❌ [DYNAMO] Error fetching all workouts:', error);
    throw error;
  }
}

/**
 * Get a single workout by ID
 * @param {string} workoutId - The workout ID
 * @returns {Object|null} The workout data or null if not found
 */
export async function getWorkoutById(workoutId) {
  try {
    console.log(`🗄️  [DYNAMO] Getting workout by ID: ${workoutId}`);

    const params = {
      TableName: DYNAMO_TABLES.WORKOUTS_TABLE,
      Key: {
        id: workoutId
      }
    };

    const startTime = Date.now();
    const result = await docClient.send(new GetCommand(params));
    const queryTime = Date.now() - startTime;

    const found = result.Item ? 'found' : 'not found';
    console.log(`🗄️  [DYNAMO] Workout ${workoutId} ${found} (${queryTime}ms)`);

    return result.Item || null;

  } catch (error) {
    console.error(`❌ [DYNAMO] Error fetching workout ${workoutId} from DynamoDB:`, error);
    throw error;
  }
}

/**
 * Get workouts within a date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array} Array of workouts
 */
export async function getWorkoutsByDateRange(startDate, endDate) {
  try {
    const params = {
      TableName: DYNAMO_TABLES.WORKOUTS_TABLE,
      FilterExpression: 'workoutDate BETWEEN :startDate AND :endDate',
      ExpressionAttributeValues: {
        ':startDate': startDate,
        ':endDate': endDate
      }
    };

    const workouts = await paginatedScan(params);

    // Sort by start_time descending
    workouts.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

    return workouts;

  } catch (error) {
    console.error('Error fetching workouts by date range:', error);
    throw error;
  }
}

/**
 * Get exercises for a specific workout
 * @param {string} workoutId - The workout ID
 * @returns {Array} Array of exercises
 */
export async function getExercisesByWorkout(workoutId) {
  try {
    const params = {
      TableName: DYNAMO_TABLES.EXERCISES_TABLE,
      IndexName: 'workout_id-index',
      KeyConditionExpression: 'workout_id = :workoutId',
      ExpressionAttributeValues: {
        ':workoutId': workoutId
      }
    };

    const result = await docClient.send(new QueryCommand(params));
    const exercises = result.Items || [];

    // Sort by exercise_index to maintain workout order
    exercises.sort((a, b) => a.exercise_index - b.exercise_index);

    return exercises;

  } catch (error) {
    console.error(`Error fetching exercises for workout ${workoutId}:`, error);
    throw error;
  }
}

/**
 * Get exercise history for a specific exercise name
 * @param {string} exerciseName - The name of the exercise
 * @returns {Array} Array of exercise records sorted by date descending
 */
export async function getExerciseHistory(exerciseName) {
  try {
    const params = {
      TableName: DYNAMO_TABLES.EXERCISES_TABLE,
      IndexName: 'exercise_name-workout_date-index',
      KeyConditionExpression: 'exercise_name = :exerciseName',
      ExpressionAttributeValues: {
        ':exerciseName': exerciseName
      },
      ScanIndexForward: false, // Sort descending by workout_date
    };

    const items = [];
    let lastKey;
    do {
      if (lastKey) params.ExclusiveStartKey = lastKey;
      const result = await docClient.send(new QueryCommand(params));
      items.push(...(result.Items || []));
      lastKey = result.LastEvaluatedKey;
    } while (lastKey);

    return items;

  } catch (error) {
    console.error(`Error fetching exercise history for ${exerciseName}:`, error);
    throw error;
  }
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Bucket workouts' totalVolume into the trailing `months` calendar months (oldest first),
 * including months with zero volume so the series has a consistent length.
 * @param {Array} workouts - workouts with `workoutDate` ('YYYY-MM-DD') and `totalVolume`
 * @param {number} months - size of the trailing window
 * @param {Date} now - reference date the window is trailing from
 * @returns {Array<{month: string, label: string, totalVolume: number}>}
 */
export function bucketVolumeByMonth(workouts, months = 12, now = new Date()) {
  const buckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({ month, label: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`, totalVolume: 0 });
  }

  const byMonth = new Map(buckets.map((b) => [b.month, b]));
  workouts.forEach((w) => {
    if (!w.workoutDate) return;
    const bucket = byMonth.get(w.workoutDate.slice(0, 7));
    if (bucket) bucket.totalVolume += w.totalVolume || 0;
  });

  buckets.forEach((b) => { b.totalVolume = Math.round(b.totalVolume); });
  return buckets;
}

/**
 * Get workout statistics for the trailing 12 calendar months.
 * @returns {Object} Summary statistics
 */
export async function getWorkoutStats() {
  try {
    const windowMonths = 12;
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - (windowMonths - 1), 1);
    const cutoffDate = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-01`;

    console.log(`🗄️  [DYNAMO] Scanning workouts table for statistics (trailing ${windowMonths} months, since ${cutoffDate})`);

    const params = {
      TableName: DYNAMO_TABLES.WORKOUTS_TABLE,
      ProjectionExpression: 'totalVolume, durationMinutes, workoutType, uniqueExercises, workoutDate',
      FilterExpression: 'workoutDate >= :cutoffDate',
      ExpressionAttributeValues: { ':cutoffDate': cutoffDate }
    };

    const startTime = Date.now();
    const workouts = await paginatedScan(params);
    const queryTime = Date.now() - startTime;

    console.log(`🗄️  [DYNAMO] Stats scan completed: ${workouts.length} workouts processed in ${queryTime}ms`);

    if (workouts.length === 0) {
      return {
        totalWorkouts: 0,
        totalVolume: 0,
        averageDuration: 0,
        workoutTypes: {},
        bestSessionVolume: 0,
        monthlyVolume: bucketVolumeByMonth([], windowMonths, now)
      };
    }

    // Calculate statistics
    const totalVolume = workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
    const averageDuration = workouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0) / workouts.length;
    const bestSessionVolume = workouts.reduce((max, w) => Math.max(max, w.totalVolume || 0), 0);

    const workoutTypes = {};
    workouts.forEach(workout => {
      const type = workout.workoutType || 'unknown';
      workoutTypes[type] = (workoutTypes[type] || 0) + 1;
    });

    return {
      totalWorkouts: workouts.length,
      totalVolume: Math.round(totalVolume),
      averageDuration: Math.round(averageDuration),
      workoutTypes,
      bestSessionVolume: Math.round(bestSessionVolume),
      monthlyVolume: bucketVolumeByMonth(workouts, windowMonths, now)
    };

  } catch (error) {
    console.error('Error fetching workout statistics:', error);
    throw error;
  }
}
