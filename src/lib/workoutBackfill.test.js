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
    expect(updatedFields.exercises).toEqual(makeWorkout().exercises);
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
});
