import handler from './update';
import { docClient } from '../../../../lib/dynamo';
import { clearApiCache } from '../../../../lib/apiCache';

jest.mock('../../../../lib/dynamo', () => ({
  docClient: { send: jest.fn() }
}));

jest.mock('../../../../lib/apiCache', () => ({
  clearApiCache: jest.fn()
}));

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const password = 'test-password';

function todayDDMMYYYY() {
  return new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.RYANKROL_SITE_KEY = password;
  docClient.send.mockResolvedValue({ Item: { date: '01-01-2024' } });
});

describe('movies update API', () => {
  it('preserves the original date and sets editedDate to today', async () => {
    const req = {
      method: 'POST',
      body: {
        title: 'Dune',
        rating: 5,
        gist: 'Great movie',
        password,
        originalId: 'movie-123'
      }
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const putCall = docClient.send.mock.calls.find(([cmd]) => cmd.input?.Item);
    expect(putCall[0].input.Item).toMatchObject({
      id: 'movie-123',
      date: '01-01-2024',
      editedDate: todayDDMMYYYY()
    });
    expect(clearApiCache).toHaveBeenCalledWith('api-movies');
  });

  it('falls back to today for date when no original date exists, but still sets editedDate', async () => {
    docClient.send.mockResolvedValue({});
    const req = {
      method: 'POST',
      body: {
        title: 'Dune',
        rating: 5,
        gist: 'Great movie',
        password,
        originalId: 'movie-456'
      }
    };
    const res = mockRes();

    await handler(req, res);

    const putCall = docClient.send.mock.calls.find(([cmd]) => cmd.input?.Item);
    expect(putCall[0].input.Item.date).toBe(todayDDMMYYYY());
    expect(putCall[0].input.Item.editedDate).toBe(todayDDMMYYYY());
  });
});
