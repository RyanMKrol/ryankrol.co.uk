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

describe('albums add API', () => {
  it('rejects a request missing lastfm even when other required fields are present', async () => {
    const req = {
      method: 'POST',
      body: {
        title: 'OK Computer',
        artist: 'Radiohead',
        rating: 5,
        highlights: 'Paranoid Android',
        password
      }
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(docClient.send).not.toHaveBeenCalled();
  });

  it('succeeds when lastfm is present alongside the other required fields', async () => {
    const req = {
      method: 'POST',
      body: {
        title: 'OK Computer',
        artist: 'Radiohead',
        rating: 5,
        highlights: 'Paranoid Android',
        password,
        lastfm: {
          mbid: 'abc-123',
          url: 'https://last.fm/music/Radiohead/OK+Computer',
          listeners: '1000000',
          playcount: '5000000',
          tags: ['alternative'],
          trackCount: 12,
          summary: 'Landmark album',
          releaseDate: '1997-05-21',
          images: [{ '#text': 'https://last.fm/cover.jpg' }]
        }
      }
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const putCall = docClient.send.mock.calls.find(([cmd]) => cmd.input?.Item);
    expect(putCall[0].input.Item).toMatchObject({ lastfm: { mbid: 'abc-123' } });
    expect(clearApiCache).toHaveBeenCalledWith('api-albums');
  });
});
