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

beforeEach(() => {
  jest.clearAllMocks();
  process.env.RYANKROL_SITE_KEY = password;
  docClient.send.mockResolvedValue({ Item: { date: '01-01-2024' } });
});

describe('books update API', () => {
  it('persists optional metadata fields when provided', async () => {
    const req = {
      method: 'POST',
      body: {
        title: 'Dune',
        author: 'Frank Herbert',
        rating: 5,
        overview: 'Great book',
        password,
        originalTitle: 'Dune',
        originalAuthor: 'Frank Herbert',
        source: 'googlebooks',
        volumeId: 'abc123',
        isbn: '9780441013593',
        publisher: 'Ace'
      }
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const putCall = docClient.send.mock.calls.find(([cmd]) => cmd.input?.Item);
    expect(putCall[0].input.Item).toMatchObject({
      source: 'googlebooks',
      volumeId: 'abc123',
      isbn: '9780441013593',
      publisher: 'Ace'
    });
    expect(clearApiCache).toHaveBeenCalledWith('api-books');
  });

  it('omits optional metadata fields cleanly when absent', async () => {
    const req = {
      method: 'POST',
      body: {
        title: 'Dune',
        author: 'Frank Herbert',
        rating: 5,
        overview: 'Great book',
        password,
        originalTitle: 'Dune',
        originalAuthor: 'Frank Herbert'
      }
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const putCall = docClient.send.mock.calls.find(([cmd]) => cmd.input?.Item);
    const item = putCall[0].input.Item;
    expect(item).not.toHaveProperty('source');
    expect(item).not.toHaveProperty('volumeId');
    expect(item).not.toHaveProperty('isbn');
    expect(item).not.toHaveProperty('publisher');
  });
});
