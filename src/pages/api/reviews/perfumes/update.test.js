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

function perfumeBody(overrides = {}) {
  return {
    title: 'Aventus',
    designer: 'Creed',
    type: 'EDP',
    description: 'Fruity and smoky',
    rating: 8,
    considerTravelSize: true,
    considerFullBottle: false,
    longevity: 6,
    projection: 3,
    seasons: ['Autumn', 'Winter'],
    applicationSpots: [{ spot: 'Wrists', sprays: 2 }],
    fragranticaUrl: 'https://www.fragrantica.com/perfume/Creed/Aventus-729.html',
    password,
    originalId: 'aventus__creed__edp',
    ...overrides
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.RYANKROL_SITE_KEY = password;
  docClient.send.mockResolvedValue({ Item: { date: '01-01-2024' } });
});

describe('perfumes update API', () => {
  it('preserves the original date and sets editedDate to today', async () => {
    const req = {
      method: 'POST',
      body: perfumeBody()
    };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const putCall = docClient.send.mock.calls.find(([cmd]) => cmd.input?.Item);
    expect(putCall[0].input.Item).toMatchObject({
      date: '01-01-2024',
      editedDate: todayDDMMYYYY()
    });
    expect(clearApiCache).toHaveBeenCalledWith('api-perfumes');
  });

  it('falls back to today for date when no original date exists, but still sets editedDate', async () => {
    docClient.send.mockResolvedValue({});
    const req = {
      method: 'POST',
      body: perfumeBody()
    };
    const res = mockRes();

    await handler(req, res);

    const putCall = docClient.send.mock.calls.find(([cmd]) => cmd.input?.Item);
    expect(putCall[0].input.Item.date).toBe(todayDDMMYYYY());
    expect(putCall[0].input.Item.editedDate).toBe(todayDDMMYYYY());
  });
});
