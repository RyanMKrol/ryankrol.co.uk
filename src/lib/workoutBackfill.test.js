import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamo';

jest.mock('./dynamo', () => ({
  ...jest.requireActual('./dynamo'),
  docClient: { send: jest.fn() }
}));

// Reconstructs { fieldName: value } from an UpdateCommand built by buildSetUpdateParams,
// so assertions don't depend on the internal #f0/:v0 aliasing scheme.
function getUpdatedFields(updateCommand) {
  const { ExpressionAttributeNames, ExpressionAttributeValues } = updateCommand.input;
  const fields = {};
  Object.entries(ExpressionAttributeNames).forEach(([nameKey, field]) => {
    fields[field] = ExpressionAttributeValues[nameKey.replace('#f', ':v')];
  });
  return fields;
}

jest.mock('./apiCache', () => ({
  clearApiCache: jest.fn()
}));

// Access the internal storeWorkoutInDynamoDB via backfillWorkouts + a mocked fetch,
// so we exercise the real DynamoDB call sequence without a live Hevy API call.
import { backfillWorkouts } from './workoutBackfill';

function makeWorkout(overrides = {}) {
  return {
    id: 'workout-1',
    title: 'Push Day',
    start_time: '2026-06-01T10:00:00.000Z',
    end_time: '2026-06-01T11:00:00.000Z',
    exercises: [
      { title: 'Bench Press', sets: [{ weight_kg: 60, reps: 10, type: 'normal' }] }
    ],
    ...overrides
  };
}

function mockFetchOnce(workouts) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ workouts, page: 1, page_count: 1 })
  });
}

describe('storeWorkoutInDynamoDB (via backfillWorkouts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HEVY_API_KEY = 'test-key';
  });

  it('stores a brand-new workout and its exercises normally', async () => {
    mockFetchOnce([makeWorkout()]);
    docClient.send.mockResolvedValue({});

    const result = await backfillWorkouts();

    const putCalls = docClient.send.mock.calls.filter(([cmd]) => cmd instanceof PutCommand);
    expect(putCalls).toHaveLength(2); // 1 workout + 1 exercise
    expect(docClient.send.mock.calls.some(([cmd]) => cmd instanceof UpdateCommand)).toBe(false);
    expect(result.newWorkouts).toBe(1);
  });

  it('leaves an already-existing complete workout alone', async () => {
    mockFetchOnce([makeWorkout()]);

    docClient.send.mockImplementation((cmd) => {
      if (cmd instanceof PutCommand && cmd.input.TableName.includes('Workout') || cmd instanceof PutCommand && cmd.input.Item?.id) {
        const err = new Error('conditional check failed');
        err.name = 'ConditionalCheckFailedException';
        return Promise.reject(err);
      }
      if (cmd instanceof GetCommand) {
        return Promise.resolve({ Item: { id: 'workout-1', exercises: [{ title: 'Bench Press', sets: [] }] } });
      }
      return Promise.resolve({});
    });

    const result = await backfillWorkouts();

    expect(docClient.send.mock.calls.some(([cmd]) => cmd instanceof UpdateCommand)).toBe(false);
    expect(result.newWorkouts).toBe(0);
  });

  it('still writes missing Exercises rows for an already-existing complete workout, without healing the Workouts item', async () => {
    mockFetchOnce([makeWorkout()]);

    docClient.send.mockImplementation((cmd) => {
      if (cmd instanceof PutCommand && cmd.input.Item?.id === 'workout-1') {
        const err = new Error('conditional check failed');
        err.name = 'ConditionalCheckFailedException';
        return Promise.reject(err);
      }
      if (cmd instanceof GetCommand) {
        return Promise.resolve({ Item: { id: 'workout-1', exercises: [{ title: 'Bench Press', sets: [] }] } });
      }
      return Promise.resolve({});
    });

    const result = await backfillWorkouts();

    expect(docClient.send.mock.calls.some(([cmd]) => cmd instanceof UpdateCommand)).toBe(false);

    const exercisePutCalls = docClient.send.mock.calls.filter(
      ([cmd]) => cmd instanceof PutCommand && cmd.input.Item?.exercise_id
    );
    expect(exercisePutCalls).toHaveLength(1);

    expect(result.newWorkouts).toBe(0);
  });

  it('heals an incomplete existing workout (missing exercises) and counts it as stored', async () => {
    mockFetchOnce([makeWorkout()]);

    docClient.send.mockImplementation((cmd) => {
      if (cmd instanceof PutCommand && cmd.input.Item?.id === 'workout-1') {
        const err = new Error('conditional check failed');
        err.name = 'ConditionalCheckFailedException';
        return Promise.reject(err);
      }
      if (cmd instanceof GetCommand) {
        return Promise.resolve({ Item: { id: 'workout-1', title: 'Push Day' } }); // no exercises field
      }
      return Promise.resolve({});
    });

    const result = await backfillWorkouts();

    const updateCalls = docClient.send.mock.calls.filter(([cmd]) => cmd instanceof UpdateCommand);
    expect(updateCalls).toHaveLength(1);
    const updatedFields = getUpdatedFields(updateCalls[0][0]);
    // The only prior set for this exercise, so it's a PR on every axis - storeExercises flags
    // it in place before workoutItem/UpdateCommand are built.
    expect(updatedFields.exercises).toEqual([
      { title: 'Bench Press', sets: [{ weight_kg: 60, reps: 10, type: 'normal', isWeightPR: true, is1RMPR: true, isVolumePR: true }] }
    ]);
    expect(updatedFields).toHaveProperty('totalVolume');
    // workoutDate must always be healed alongside the other metrics - this is the exact field
    // that silently went missing in production before buildSetUpdateParams existed.
    expect(updatedFields.workoutDate).toBe('2026-06-01');

    const exercisePutCalls = docClient.send.mock.calls.filter(
      ([cmd]) => cmd instanceof PutCommand && cmd.input.Item?.exercise_id
    );
    expect(exercisePutCalls).toHaveLength(1);

    expect(result.newWorkouts).toBe(1);
  });

  it('flags only the second of two sequential workouts on the axis it actually breaks', async () => {
    // In-memory fake of the Exercises table, keyed like the real exercise_name-workout_date-index,
    // so getBestPriorMetrics sees the first workout's row when the second is stored.
    const exerciseRows = [];

    docClient.send.mockImplementation((cmd) => {
      if (cmd.constructor.name === 'QueryCommand') {
        const { exercise_name, beforeDate } = {
          exercise_name: cmd.input.ExpressionAttributeValues[':exerciseName'],
          beforeDate: cmd.input.ExpressionAttributeValues[':beforeDate']
        };
        return Promise.resolve({
          Items: exerciseRows.filter((r) => r.exercise_name === exercise_name && r.workout_date < beforeDate)
        });
      }
      if (cmd instanceof PutCommand && cmd.input.Item?.exercise_id) {
        exerciseRows.push(cmd.input.Item);
        return Promise.resolve({});
      }
      return Promise.resolve({});
    });

    const workout1 = makeWorkout({
      id: 'workout-1',
      start_time: '2026-06-01T10:00:00.000Z',
      end_time: '2026-06-01T11:00:00.000Z',
      exercises: [{ title: 'Bench Press', sets: [{ weight_kg: 50, reps: 20, type: 'normal' }] }]
      // heaviestWeight 50, bestEstimated1RM ~83.3, bestSetVolume 1000
    });
    // Heavier weight (new weight PR), but its 1RM/volume are lower than workout1's set - only
    // isWeightPR should get flagged on workout2.
    const workout2 = makeWorkout({
      id: 'workout-2',
      start_time: '2026-06-08T10:00:00.000Z',
      end_time: '2026-06-08T11:00:00.000Z',
      exercises: [{ title: 'Bench Press', sets: [{ weight_kg: 60, reps: 1, type: 'normal' }] }]
      // heaviestWeight 60 (PR), bestEstimated1RM 60 (not a PR), bestSetVolume 60 (not a PR)
    });

    // storeWorkoutInDynamoDB processes workouts in array order, so list workout1 (earlier
    // date) first so its Exercises row exists as "prior" by the time workout2 is stored.
    mockFetchOnce([workout1, workout2]);

    await backfillWorkouts();

    expect(workout1.exercises[0].sets[0]).toMatchObject({ isWeightPR: true, is1RMPR: true, isVolumePR: true });
    expect(workout2.exercises[0].sets[0].isWeightPR).toBe(true);
    expect(workout2.exercises[0].sets[0].is1RMPR).toBeUndefined();
    expect(workout2.exercises[0].sets[0].isVolumePR).toBeUndefined();
  });
});
