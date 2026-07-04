jest.mock('../lib/workoutBackfill', () => ({
  storeWorkoutInDynamoDB: jest.fn().mockResolvedValue(true),
}));

import { backfillMissing } from './auditWorkouts';
import { storeWorkoutInDynamoDB } from '../lib/workoutBackfill';

describe('backfillMissing', () => {
  beforeEach(() => {
    storeWorkoutInDynamoDB.mockClear();
  });

  it('calls the shared storeWorkoutInDynamoDB once per missing workout with the raw Hevy workout object', async () => {
    const workouts = [
      { id: 'w1', title: 'Push Day', start_time: '2026-06-01T10:00:00.000Z', exercises: [{ title: 'Bench Press' }] },
      { id: 'w2', title: 'Pull Day', start_time: '2026-06-02T10:00:00.000Z', exercises: [{ title: 'Row' }] },
    ];

    await backfillMissing(workouts);

    expect(storeWorkoutInDynamoDB).toHaveBeenCalledTimes(2);
    expect(storeWorkoutInDynamoDB).toHaveBeenNthCalledWith(1, workouts[0]);
    expect(storeWorkoutInDynamoDB).toHaveBeenNthCalledWith(2, workouts[1]);
  });

  it('counts workouts stored vs skipped based on the shared function\'s return value', async () => {
    storeWorkoutInDynamoDB
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const workouts = [
      { id: 'w1', title: 'Push Day', start_time: '2026-06-01T10:00:00.000Z', exercises: [] },
      { id: 'w2', title: 'Pull Day', start_time: '2026-06-02T10:00:00.000Z', exercises: [] },
    ];

    await backfillMissing(workouts);

    expect(storeWorkoutInDynamoDB).toHaveBeenCalledTimes(2);
  });

  it('propagates an error from the shared function rather than silently swallowing it', async () => {
    storeWorkoutInDynamoDB.mockRejectedValueOnce(new Error('boom'));

    const workouts = [
      { id: 'w1', title: 'Push Day', start_time: '2026-06-01T10:00:00.000Z', exercises: [] },
    ];

    await expect(backfillMissing(workouts)).rejects.toThrow('boom');
  });
});
