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

describe('movies add API', () => {
  it('rejects a request missing tmdbId even when other required fields are present', async () => {
    const req = {
      method: 'POST',
      body: {
        title: 'Dune',
        rating: 5,
        gist: 'Great movie',
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
        title: 'Dune',
        rating: 5,
        gist: 'Great movie',
        password,
        tmdbId: 438631,
        mediaType: 'movie',
        posterPath: '/poster.jpg',
        tmdbOverview: 'A sci-fi epic',
        tmdbDate: '2021-10-22'
      }
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const putCall = docClient.send.mock.calls.find(([cmd]) => cmd.input?.Item);
    expect(putCall[0].input.Item).toMatchObject({ tmdbId: 438631 });
    expect(putCall[0].input.Item.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(clearApiCache).toHaveBeenCalledWith('api-movies');
  });
});
