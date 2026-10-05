import { UNDERGROUND_MAX_FOLLOWERS, type Genre } from '../game/config';
import type { Track } from '../game/types';

/**
 * Audius is an open, artist-owned streaming network full of independent artists, which makes it
 * the music source for the underground edition. Its public API needs no key, only an app name.
 * https://docs.audius.org/developers/api
 */
const GATEWAY = 'https://api.audius.co';
export const APP_NAME = 'unheard-underground';

const MIN_DURATION_SEC = 45;
const MIN_POOL_SIZE = 15;

type AudiusUser = {
  id: string;
  name: string;
  handle: string;
  follower_count?: number;
};

export type AudiusTrack = {
  id: string;
  title: string;
  user: AudiusUser;
  artwork?: Record<string, string> | null;
  duration: number;
  genre?: string | null;
  permalink?: string;
  play_count?: number;
  is_streamable?: boolean;
  is_delete?: boolean;
  stream_conditions?: unknown;
};

type Fetch = typeof fetch;

let baseUrl: string | null = null;

function withParams(path: string, params: Record<string, string | number | undefined> = {}): string {
  const qs = Object.entries({ ...params, app_name: APP_NAME })
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${path}?${qs}`;
}

async function getJson<T>(url: string, fetchImpl: Fetch): Promise<T> {
  const res = await fetchImpl(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Audius request failed (${res.status})`);
  return (await res.json()) as T;
}

/**
 * The gateway serves the API directly. If it ever stops doing so, fall back to the older
 * discovery flow, where the gateway root returns a list of API hosts to pick from.
 */
async function request<T>(path: string, params: Record<string, string | number | undefined>, fetchImpl: Fetch): Promise<T> {
  if (baseUrl) return getJson<T>(baseUrl + withParams(path, params), fetchImpl);
  try {
    const data = await getJson<T>(GATEWAY + withParams(path, params), fetchImpl);
    baseUrl = GATEWAY;
    return data;
  } catch (gatewayError) {
    let hosts: string[] = [];
    try {
      hosts = (await getJson<{ data?: string[] }>(GATEWAY, fetchImpl)).data ?? [];
    } catch {
      throw gatewayError;
    }
    if (hosts.length === 0) throw gatewayError;
    const host = hosts[Math.floor(Math.random() * hosts.length)];
    const data = await getJson<T>(host + withParams(path, params), fetchImpl);
    baseUrl = host;
    return data;
  }
}

export function resetAudiusHost(): void {
  baseUrl = null;
}

export function streamUrl(trackId: string): string {
  return (baseUrl ?? GATEWAY) + withParams(`/v1/tracks/${encodeURIComponent(trackId)}/stream`);
}

export function trackUrl(track: Pick<Track, 'permalink' | 'artistHandle'>): string {
  if (track.permalink) return `https://audius.co${track.permalink.startsWith('/') ? '' : '/'}${track.permalink}`;
  return `https://audius.co/${track.artistHandle}`;
}

function isPlayable(t: AudiusTrack): boolean {
  return (
    !!t?.id &&
    !!t.title &&
    !!t.user &&
    t.is_delete !== true &&
    t.is_streamable !== false &&
    !t.stream_conditions &&
    typeof t.duration === 'number' &&
    t.duration >= MIN_DURATION_SEC
  );
}

export function toTrack(t: AudiusTrack): Track {
  const art = t.artwork ?? null;
  return {
    id: t.id,
    title: t.title.trim(),
    artist: t.user.name?.trim() || t.user.handle,
    artistId: t.user.id,
    artistHandle: t.user.handle,
    followers: t.user.follower_count ?? 0,
    artwork: art ? art['480x480'] ?? art['1000x1000'] ?? art['150x150'] ?? null : null,
    duration: t.duration,
    genre: t.genre ?? '',
    permalink: t.permalink ?? '',
    plays: t.play_count ?? 0,
  };
}

function dedupe(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  return tracks.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
}

/**
 * Keeps artists under the underground follower cap. If a genre is too thin after filtering,
 * fill up with its least-followed artists so there's always something to play.
 */
export function undergroundOnly(tracks: Track[], maxFollowers = UNDERGROUND_MAX_FOLLOWERS): Track[] {
  const under = tracks.filter((t) => t.followers <= maxFollowers);
  if (under.length >= MIN_POOL_SIZE) return under;
  const rest = tracks
    .filter((t) => t.followers > maxFollowers)
    .sort((a, b) => a.followers - b.followers)
    .slice(0, MIN_POOL_SIZE - under.length);
  return [...under, ...rest];
}

export async function fetchPool(genre: Genre, fetchImpl: Fetch = fetch): Promise<Track[]> {
  let raw: AudiusTrack[];
  if (genre.audiusGenre === null) {
    const res = await request<{ data?: AudiusTrack[] }>('/v1/tracks/trending/underground', { limit: 100 }, fetchImpl);
    raw = res.data ?? [];
  } else {
    const [month, allTime] = await Promise.all([
      request<{ data?: AudiusTrack[] }>('/v1/tracks/trending', { genre: genre.audiusGenre, time: 'month' }, fetchImpl),
      request<{ data?: AudiusTrack[] }>('/v1/tracks/trending', { genre: genre.audiusGenre, time: 'allTime' }, fetchImpl).catch(
        () => ({ data: [] as AudiusTrack[] }),
      ),
    ]);
    raw = [...(month.data ?? []), ...(allTime.data ?? [])];
  }
  const tracks = dedupe(raw.filter(isPlayable).map(toTrack));
  return genre.audiusGenre === null ? tracks : undergroundOnly(tracks);
}

export async function searchAudius(query: string, fetchImpl: Fetch = fetch): Promise<Track[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const res = await request<{ data?: AudiusTrack[] }>('/v1/tracks/search', { query: q, limit: 10 }, fetchImpl);
  return dedupe((res.data ?? []).filter(isPlayable).map(toTrack));
}
