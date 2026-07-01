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

describe('tv add API', () => {
  it('rejects a request missing tmdbId even when other required fields are present', async () => {
    const req = {
      method: 'POST',
      body: {
        title: 'Severance',
        rating: 5,
        gist: 'Great show',
        password
      }
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(docClient.send).not.toHaveBeenCalled();
  });

  it('succeeds when tmdbId is present alongside the other required fields', async () => {
    const req = {
      method: 'POST',
      body: {
        title: 'Severance',
        rating: 5,
        gist: 'Great show',
        password,
        tmdbId: 95396,
        mediaType: 'tv',
        posterPath: '/poster.jpg',
        tmdbOverview: 'A workplace thriller',
        tmdbDate: '2022-02-18'
      }
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const putCall = docClient.send.mock.calls.find(([cmd]) => cmd.input?.Item);
    expect(putCall[0].input.Item).toMatchObject({ tmdbId: 95396 });
    expect(clearApiCache).toHaveBeenCalledWith('api-tv');
  });
});
