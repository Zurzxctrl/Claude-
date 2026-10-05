import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { Difficulty } from '../game/config';

/**
 * The global leaderboard runs on Supabase. It turns on when both env vars are set
 * (see README → "Global leaderboard"); without them the app plays fine and keeps stats on-device.
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const leaderboardEnabled = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';

export type Period = 'week' | 'all';

export type LeaderboardRow = {
  playerId: string;
  name: string;
  country: string | null;
  avatar: number;
  points: number;
  rank: number;
};

export type MyRank = { rank: number; points: number } | null;

let client: SupabaseClient | null = null;

function supabase(): SupabaseClient {
  if (!leaderboardEnabled) throw new Error('Leaderboard is not configured');
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

/** Signs the device in anonymously the first time, so scores belong to a stable player id. */
export async function ensurePlayer(profile: { name: string; country: string | null; avatar: number }): Promise<string> {
  const sb = supabase();
  let { data: { session } } = await sb.auth.getSession();
  if (!session) {
    const { data, error } = await sb.auth.signInAnonymously();
    if (error) throw error;
    session = data.session;
  }
  const id = session!.user.id;
  const { error } = await sb.from('players').upsert({
    id,
    name: profile.name,
    country: profile.country,
    avatar: profile.avatar,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return id;
}

export async function submitRound(round: { points: number; won: boolean; genre: string; difficulty: Difficulty }): Promise<void> {
  const { error } = await supabase().rpc('submit_round', {
    p_points: round.points,
    p_won: round.won,
    p_genre: round.genre,
    p_difficulty: round.difficulty,
  });
  if (error) throw error;
}

type RpcRow = { player_id: string; name: string; country: string | null; avatar: number; points: number; rank: number };

export async function fetchLeaderboard(period: Period, country: string | null): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase().rpc('get_leaderboard', {
    p_period: period,
    p_country: country,
    p_limit: 50,
  });
  if (error) throw error;
  return ((data ?? []) as RpcRow[]).map((r) => ({
    playerId: r.player_id,
    name: r.name,
    country: r.country,
    avatar: r.avatar,
    points: Number(r.points),
    rank: Number(r.rank),
  }));
}

export async function fetchMyRank(period: Period, country: string | null): Promise<MyRank> {
  const { data, error } = await supabase().rpc('get_my_rank', { p_period: period, p_country: country });
  if (error) throw error;
  const row = (data as { rank: number; points: number }[] | null)?.[0];
  return row ? { rank: Number(row.rank), points: Number(row.points) } : null;
}

export async function deletePlayer(): Promise<void> {
  const sb = supabase();
  const { error } = await sb.rpc('delete_me');
  if (error) throw error;
  await sb.auth.signOut();
}
