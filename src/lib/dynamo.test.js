jest.mock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: jest.fn() }));
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: jest.fn(() => ({})) },
  ScanCommand: jest.fn(),
}));

const { buildSetUpdateParams } = require('./dynamo');

describe('buildSetUpdateParams', () => {
  it('derives the UpdateExpression and attribute maps from every key in `fields`', () => {
    const params = buildSetUpdateParams('Workouts', { id: 'w1' }, {
      totalVolume: 100,
      workoutDate: '2026-06-30',
    });

    expect(params.TableName).toBe('Workouts');
    expect(params.Key).toEqual({ id: 'w1' });
    expect(params.ExpressionAttributeNames).toEqual({ '#f0': 'totalVolume', '#f1': 'workoutDate' });
    expect(params.ExpressionAttributeValues).toEqual({ ':v0': 100, ':v1': '2026-06-30' });
    expect(params.UpdateExpression).toBe('SET #f0 = :v0, #f1 = :v1');
  });

  it('never drops a field, even ones that collide with DynamoDB reserved words', () => {
    const params = buildSetUpdateParams('Workouts', { id: 'w1' }, {
      status: 'done',
      date: '2026-07-03',
      name: 'Push',
    });

    expect(Object.values(params.ExpressionAttributeNames)).toEqual(['status', 'date', 'name']);
    expect(params.UpdateExpression).toBe('SET #f0 = :v0, #f1 = :v1, #f2 = :v2');
  });
});
