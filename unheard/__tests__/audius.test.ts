import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { getGenre } from '../src/game/config';
import { fetchPool, resetAudiusHost, searchAudius, streamUrl, toTrack, trackUrl, undergroundOnly } from '../src/services/audius';
import { audiusTrack, track } from '../testing/fixtures';

type Route = (url: string) => { status?: number; body: unknown } | undefined;

function mockFetch(route: Route) {
  const calls: string[] = [];
  const impl = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    const hit = route(url);
    if (!hit) return new Response('not found', { status: 404 });
    return new Response(JSON.stringify(hit.body), { status: hit.status ?? 200 });
  });
  return { impl: impl as unknown as typeof fetch, calls };
}

beforeEach(() => resetAudiusHost());

describe('toTrack', () => {
  it('maps the Audius shape to a game track', () => {
    expect(toTrack(audiusTrack())).toEqual({
      id: 'D7KyD',
      title: 'Static Bloom',
      artist: 'Lowlight',
      artistId: 'nlGNe',
      artistHandle: 'lowlight',
      followers: 850,
      artwork: 'https://img/480.jpg',
      duration: 201,
      genre: 'Electronic',
      permalink: '/lowlight/static-bloom',
      plays: 3200,
    });
  });

  it('copes with missing artwork and names', () => {
    const t = toTrack(audiusTrack({ artwork: null }, { name: '' }));
    expect(t.artwork).toBeNull();
    expect(t.artist).toBe('lowlight');
  });
});

describe('fetchPool', () => {
  it('uses the underground trending chart for "All" and drops unplayable tracks', async () => {
    const { impl, calls } = mockFetch((url) =>
      url.includes('/v1/tracks/trending/underground')
        ? {
            body: {
              data: [
                audiusTrack(),
                audiusTrack({ id: 'short', duration: 20 }),
                audiusTrack({ id: 'gated', stream_conditions: { usdc_purchase: {} } }),
                audiusTrack({ id: 'nostream', is_streamable: false }),
                audiusTrack(),
              ],
            },
          }
        : undefined,
    );
    const pool = await fetchPool(getGenre('underground'), impl);
    expect(pool.map((t) => t.id)).toEqual(['D7KyD']);
    expect(calls[0]).toContain('app_name=unheard-underground');
  });

  it('merges month and all-time genre charts and keeps only small artists', async () => {
    const small = Array.from({ length: 16 }, (_, i) => audiusTrack({ id: `s${i}` }, { follower_count: 100 + i }));
    const big = audiusTrack({ id: 'big' }, { follower_count: 500_000 });
    const { impl, calls } = mockFetch((url) => {
      if (url.includes('time=month')) return { body: { data: [...small.slice(0, 10), big] } };
      if (url.includes('time=allTime')) return { body: { data: small.slice(8) } };
      return undefined;
    });
    const pool = await fetchPool(getGenre('hiphop'), impl);
    expect(pool).toHaveLength(16);
    expect(pool.find((t) => t.id === 'big')).toBeUndefined();
    expect(calls.some((c) => c.includes('genre=Hip-Hop%2FRap'))).toBe(true);
  });

  it('falls back to discovery hosts when the gateway does not serve the API', async () => {
    const { impl, calls } = mockFetch((url) => {
      if (url === 'https://api.audius.co') return { body: { data: ['https://dn1.example'] } };
      if (url.startsWith('https://dn1.example/v1/tracks/trending/underground')) return { body: { data: [audiusTrack()] } };
      return undefined;
    });
    const pool = await fetchPool(getGenre('underground'), impl);
    expect(pool).toHaveLength(1);
    expect(calls).toHaveLength(3);
    expect(streamUrl('abc')).toBe('https://dn1.example/v1/tracks/abc/stream?app_name=unheard-underground');
  });

  it('surfaces errors when nothing answers', async () => {
    const { impl } = mockFetch(() => undefined);
    await expect(fetchPool(getGenre('underground'), impl)).rejects.toThrow('Audius request failed (404)');
  });
});

describe('undergroundOnly', () => {
  it('tops up thin pools with the least-followed big artists', () => {
    const tracks = [
      track({ id: 'small', followers: 10 }),
      track({ id: 'huge', followers: 900_000 }),
      track({ id: 'mid', followers: 40_000 }),
    ];
    expect(undergroundOnly(tracks).map((t) => t.id)).toEqual(['small', 'mid', 'huge']);
  });
});

describe('searchAudius and links', () => {
  it('searches only with two or more characters', async () => {
    const { impl, calls } = mockFetch(() => ({ body: { data: [audiusTrack()] } }));
    expect(await searchAudius('a', impl)).toEqual([]);
    expect(calls).toHaveLength(0);
    expect(await searchAudius('static', impl)).toHaveLength(1);
    expect(calls[0]).toContain('/v1/tracks/search?query=static');
  });

  it('builds Audius links', () => {
    expect(trackUrl(track())).toBe('https://audius.co/nightcrawler/basement-tapes');
    expect(trackUrl(track({ permalink: '' }))).toBe('https://audius.co/nightcrawler');
  });
});
