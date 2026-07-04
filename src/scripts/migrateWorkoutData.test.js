jest.mock('../lib/workoutBackfill', () => ({
  storeWorkoutInDynamoDB: jest.fn().mockResolvedValue(true),
}));

import { migrateWorkoutData } from './migrateWorkoutData';
import { storeWorkoutInDynamoDB } from '../lib/workoutBackfill';

describe('migrateWorkoutData', () => {
  beforeEach(() => {
    storeWorkoutInDynamoDB.mockClear();
  });

  it('calls the shared storeWorkoutInDynamoDB once per workout with the raw Hevy workout object', async () => {
    const workouts = [
      { id: 'w1', title: 'Push Day', exercises: [{ title: 'Bench Press' }] },
      { id: 'w2', title: 'Pull Day', exercises: [{ title: 'Row' }] },
    ];

    await migrateWorkoutData(workouts);

    expect(storeWorkoutInDynamoDB).toHaveBeenCalledTimes(2);
    expect(storeWorkoutInDynamoDB).toHaveBeenNthCalledWith(1, workouts[0]);
    expect(storeWorkoutInDynamoDB).toHaveBeenNthCalledWith(2, workouts[1]);
  });

  it('continues processing remaining workouts if one fails', async () => {
    storeWorkoutInDynamoDB
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(true);

    const workouts = [
      { id: 'w1', title: 'Push Day', exercises: [] },
      { id: 'w2', title: 'Pull Day', exercises: [] },
    ];

    await migrateWorkoutData(workouts);

    expect(storeWorkoutInDynamoDB).toHaveBeenCalledTimes(2);
  });
});
