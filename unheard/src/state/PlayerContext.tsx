import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type { Difficulty, GenreId } from '../game/config';
import { applyRoundToStats, pointsFor, type RoundState } from '../game/logic';
import { cleanName, randomAvatar, randomName } from '../game/names';
import { EMPTY_STATS, type Stats } from '../game/types';
import * as leaderboard from '../services/leaderboard';
import { clearAll, load, save } from '../services/storage';

export type Profile = {
  name: string;
  avatar: number;
  country: string | null;
};

export type Prefs = {
  genre: GenreId;
  difficulty: Difficulty;
  recent: string[];
};

const DEFAULT_PREFS: Prefs = { genre: 'underground', difficulty: 'easy', recent: [] };
const RECENT_LIMIT = 40;

function deviceCountry(): string | null {
  try {
    const code = getLocales()[0]?.regionCode;
    return code && /^[A-Z]{2}$/i.test(code) ? code.toUpperCase() : null;
  } catch {
    return null;
  }
}

function freshProfile(): Profile {
  return { name: randomName(), avatar: randomAvatar(), country: deviceCountry() };
}

type PlayerContextValue = {
  ready: boolean;
  profile: Profile;
  stats: Stats;
  prefs: Prefs;
  /** Bumps whenever a round is saved to the global leaderboard, so lists can refresh. */
  syncVersion: number;
  setName: (name: string) => void;
  setPrefs: (patch: Partial<Prefs>) => void;
  recordRound: (round: RoundState, genre: GenreId) => void;
  resetEverything: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile>(() => freshProfile());
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [syncVersion, setSyncVersion] = useState(0);
  const playerReady = useRef<Promise<string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const initial = freshProfile();
      const [p, s, pr] = await Promise.all([
        load<Profile>('profile', initial),
        load<Stats>('stats', EMPTY_STATS),
        load<Prefs>('prefs', DEFAULT_PREFS),
      ]);
      if (cancelled) return;
      if (p === initial) save('profile', p);
      setProfile(p);
      setStats(s);
      setPrefsState(pr);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const syncPlayer = useCallback((p: Profile) => {
    if (!leaderboard.leaderboardEnabled) return null;
    playerReady.current = leaderboard.ensurePlayer(p);
    playerReady.current.catch((e) => {
      console.warn('[leaderboard] could not register player', e);
      playerReady.current = null;
    });
    return playerReady.current;
  }, []);

  useEffect(() => {
    if (ready) syncPlayer(profile);
  }, [ready, profile, syncPlayer]);

  const setName = useCallback((name: string) => {
    const cleaned = cleanName(name);
    if (!cleaned) return;
    setProfile((prev) => {
      const next = { ...prev, name: cleaned };
      save('profile', next);
      return next;
    });
  }, []);

  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch };
      save('prefs', next);
      return next;
    });
  }, []);

  const recordRound = useCallback(
    (round: RoundState, genre: GenreId) => {
      if (round.status === 'playing') return;
      setStats((prev) => {
        const next = applyRoundToStats(prev, round);
        save('stats', next);
        return next;
      });
      setPrefsState((prev) => {
        const recent = [round.answer.id, ...prev.recent.filter((id) => id !== round.answer.id)].slice(0, RECENT_LIMIT);
        const next = { ...prev, recent };
        save('prefs', next);
        return next;
      });
      if (leaderboard.leaderboardEnabled) {
        const ensure = playerReady.current ?? syncPlayer(profile);
        ensure
          ?.then(() =>
            leaderboard.submitRound({
              points: pointsFor(round),
              won: round.status === 'won',
              genre,
              difficulty: round.difficulty,
            }),
          )
          .then(() => setSyncVersion((v) => v + 1))
          .catch((e) => console.warn('[leaderboard] could not submit round', e));
      }
    },
    [profile, syncPlayer],
  );

  const resetEverything = useCallback(async () => {
    if (leaderboard.leaderboardEnabled) {
      await leaderboard.deletePlayer().catch((e) => console.warn('[leaderboard] could not delete player', e));
      playerReady.current = null;
    }
    await clearAll();
    const p = freshProfile();
    save('profile', p);
    setProfile(p);
    setStats(EMPTY_STATS);
    setPrefsState(DEFAULT_PREFS);
    setSyncVersion((v) => v + 1);
  }, []);

  const value = useMemo(
    () => ({ ready, profile, stats, prefs, syncVersion, setName, setPrefs, recordRound, resetEverything }),
    [ready, profile, stats, prefs, syncVersion, setName, setPrefs, recordRound, resetEverything],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}
