import type { AudiusTrack } from '../src/services/audius';
import type { Track } from '../src/game/types';

export function track(overrides: Partial<Track> = {}): Track {
  return {
    id: 'a1',
    title: 'Basement Tapes',
    artist: 'Nightcrawler',
    artistId: 'u1',
    artistHandle: 'nightcrawler',
    followers: 1200,
    artwork: null,
    duration: 180,
    genre: 'Hip-Hop/Rap',
    permalink: '/nightcrawler/basement-tapes',
    plays: 5400,
    ...overrides,
  };
}

export function audiusTrack(overrides: Partial<AudiusTrack> = {}, user: Partial<AudiusTrack['user']> = {}): AudiusTrack {
  return {
    id: 'D7KyD',
    title: 'Static Bloom',
    user: { id: 'nlGNe', name: 'Lowlight', handle: 'lowlight', follower_count: 850, ...user },
    artwork: { '150x150': 'https://img/150.jpg', '480x480': 'https://img/480.jpg', '1000x1000': 'https://img/1000.jpg' },
    duration: 201,
    genre: 'Electronic',
    permalink: '/lowlight/static-bloom',
    play_count: 3200,
    is_streamable: true,
    ...overrides,
  };
}
