import { mapAlbumSearchResult, mapAlbumInfo } from './lastfm';

const SEARCH_ITEM = {
  name: 'Rumours',
  artist: 'Fleetwood Mac',
  mbid: 'abc123',
  url: 'https://www.last.fm/music/Fleetwood+Mac/Rumours',
  image: [
    { size: 'small', '#text': 'https://img.last.fm/small.jpg' },
    { size: 'medium', '#text': 'https://img.last.fm/medium.jpg' },
    { size: 'large', '#text': 'https://img.last.fm/large.jpg' },
    { size: 'extralarge', '#text': 'https://img.last.fm/extralarge.jpg' },
  ],
};

const SPARSE_ALBUM_INFO = {
  name: 'Rumours',
  artist: 'Fleetwood Mac',
  mbid: '',
  url: 'https://www.last.fm/music/Fleetwood+Mac/Rumours',
  image: [{ size: 'small', '#text': '' }],
};

const FULL_ALBUM_INFO = {
  name: 'Rumours',
  artist: { name: 'Fleetwood Mac' },
  mbid: 'abc123',
  url: 'https://www.last.fm/music/Fleetwood+Mac/Rumours',
  listeners: '5000000',
  playcount: '120000000',
  image: [
    { size: 'small', '#text': 'https://img.last.fm/small.jpg' },
    { size: 'extralarge', '#text': 'https://img.last.fm/extralarge.jpg' },
  ],
  tags: {
    tag: [{ name: 'rock' }, { name: 'classic rock' }],
  },
  tracks: {
    track: [{ name: 'Go Your Own Way' }, { name: 'The Chain' }, { name: 'Dreams' }],
  },
  wiki: {
    summary: 'Rumours is the eleventh studio album by Fleetwood Mac.',
    published: '04 Feb 1977',
  },
};

describe('mapAlbumSearchResult', () => {
  it('maps a full item to the expected shape', () => {
    const result = mapAlbumSearchResult(SEARCH_ITEM);
    expect(result).toEqual({
      title: 'Rumours',
      artist: 'Fleetwood Mac',
      mbid: 'abc123',
      url: 'https://www.last.fm/music/Fleetwood+Mac/Rumours',
      image: 'https://img.last.fm/extralarge.jpg',
    });
  });

  it('picks the LARGEST non-empty image', () => {
    const item = {
      ...SEARCH_ITEM,
      image: [
        { size: 'small', '#text': 'https://small.jpg' },
        { size: 'extralarge', '#text': '' }, // empty — should be skipped
        { size: 'large', '#text': 'https://large.jpg' },
      ],
    };
    const result = mapAlbumSearchResult(item);
    expect(result.image).toBe('https://large.jpg');
  });

  it('returns null image when all images are empty', () => {
    const item = { ...SEARCH_ITEM, image: [{ size: 'large', '#text': '' }] };
    expect(mapAlbumSearchResult(item).image).toBeNull();
  });

  it('returns null image when image field is missing', () => {
    const { image: _image, ...rest } = SEARCH_ITEM;
    expect(mapAlbumSearchResult(rest).image).toBeNull();
  });

  it('coerces empty mbid to null', () => {
    const item = { ...SEARCH_ITEM, mbid: '' };
    expect(mapAlbumSearchResult(item).mbid).toBeNull();
  });
});

describe('mapAlbumInfo', () => {
  it('maps a full getInfo response', () => {
    const result = mapAlbumInfo(FULL_ALBUM_INFO);
    expect(result.title).toBe('Rumours');
    expect(result.artist).toBe('Fleetwood Mac');
    expect(result.mbid).toBe('abc123');
    expect(result.listeners).toBe(5000000);
    expect(result.playcount).toBe(120000000);
    expect(result.tags).toEqual(['rock', 'classic rock']);
    expect(result.trackCount).toBe(3);
    expect(result.summary).toBe('Rumours is the eleventh studio album by Fleetwood Mac.');
    expect(result.releaseDate).toBe('04 Feb 1977');
    expect(result.image).toBe('https://img.last.fm/extralarge.jpg');
    expect(result.images).toEqual({
      small: 'https://img.last.fm/small.jpg',
      extralarge: 'https://img.last.fm/extralarge.jpg',
    });
  });

  it('handles sparse response without throwing', () => {
    const result = mapAlbumInfo(SPARSE_ALBUM_INFO);
    expect(result.tags).toEqual([]);
    expect(result.trackCount).toBe(0);
    expect(result.summary).toBeNull();
    expect(result.releaseDate).toBeNull();
    expect(result.listeners).toBe(0);
    expect(result.playcount).toBe(0);
    expect(result.mbid).toBeNull();
    expect(result.image).toBeNull();
  });

  it('handles completely empty object without throwing', () => {
    expect(() => mapAlbumInfo({})).not.toThrow();
    const result = mapAlbumInfo({});
    expect(result.title).toBeNull();
    expect(result.tags).toEqual([]);
    expect(result.trackCount).toBe(0);
  });

  it('handles string artist field', () => {
    const result = mapAlbumInfo({ ...SPARSE_ALBUM_INFO, artist: 'Fleetwood Mac' });
    expect(result.artist).toBe('Fleetwood Mac');
  });

  it('handles object artist field', () => {
    const result = mapAlbumInfo({ ...SPARSE_ALBUM_INFO, artist: { name: 'Fleetwood Mac' } });
    expect(result.artist).toBe('Fleetwood Mac');
  });

  it('counts a single track (not array) as trackCount 1', () => {
    const result = mapAlbumInfo({ tracks: { track: { name: 'Go Your Own Way' } } });
    expect(result.trackCount).toBe(1);
  });
});
