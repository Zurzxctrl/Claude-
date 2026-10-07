export type Track = {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  artistHandle: string;
  followers: number;
  artwork: string | null;
  duration: number;
  genre: string;
  permalink: string;
  plays: number;
};

export type GuessKind = 'correct' | 'artist' | 'wrong' | 'skip';

export type Guess = {
  kind: GuessKind;
  label: string;
  trackId?: string;
};

export type RoundStatus = 'playing' | 'won' | 'lost';

export type Stats = {
  played: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
  points: number;
  /** Index 0–4: won on that guess. Index 5: lost. */
  distribution: number[];
};

export const EMPTY_STATS: Stats = {
  played: 0,
  wins: 0,
  currentStreak: 0,
  bestStreak: 0,
  points: 0,
  distribution: [0, 0, 0, 0, 0, 0],
};
