import handler from './add';
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

beforeEach(() => {
  jest.clearAllMocks();
  process.env.RYANKROL_SITE_KEY = password;
  docClient.send.mockResolvedValue({});
});

describe('books add API', () => {
  it('rejects a request missing volumeId even when other required fields are present', async () => {
    const req = {
      method: 'POST',
      body: {
        title: 'Dune',
        author: 'Frank Herbert',
        rating: 5,
        overview: 'Great book',
        password
      }
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(docClient.send).not.toHaveBeenCalled();
  });

  it('succeeds when volumeId is present alongside the other required fields', async () => {
    const req = {
      method: 'POST',
      body: {
        title: 'Dune',
        author: 'Frank Herbert',
        rating: 5,
        overview: 'Great book',
        password,
        source: 'googlebooks',
        volumeId: 'abc123'
      }
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(clearApiCache).toHaveBeenCalledWith('api-books');
  });
});
