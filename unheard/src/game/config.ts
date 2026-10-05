export type Difficulty = 'easy' | 'medium' | 'hard';

export const MAX_GUESSES = 5;

/** Seconds of audio unlocked at each guess. Index 0 is the first listen. */
export const CLIP_SCHEDULE: Record<Difficulty, readonly number[]> = {
  easy: [1, 2, 4, 8, 15],
  medium: [0.5, 1, 2, 4, 8],
  hard: [0.1, 0.5, 1, 2, 4],
};

export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export const DIFFICULTIES: { id: Difficulty; label: string; color: string; dim: string }[] = [
  { id: 'easy', label: 'Easy', color: '#B8FF3C', dim: '#2C3D10' },
  { id: 'medium', label: 'Medium', color: '#FFC93C', dim: '#3A2E10' },
  { id: 'hard', label: 'Hard', color: '#B57BFF', dim: '#2A1A40' },
];

export type GenreId =
  | 'underground'
  | 'hiphop'
  | 'trap'
  | 'electronic'
  | 'house'
  | 'dnb'
  | 'lofi'
  | 'hyperpop'
  | 'alternative'
  | 'experimental'
  | 'rnb';

export type Genre = {
  id: GenreId;
  label: string;
  emoji: string;
  /** Audius genre name. `null` means the cross-genre underground trending chart. */
  audiusGenre: string | null;
  color: string;
  ink: string;
};

export const GENRES: Genre[] = [
  { id: 'underground', label: 'All', emoji: '🎚️', audiusGenre: null, color: '#B8FF3C', ink: '#0B1400' },
  { id: 'hiphop', label: 'Hip Hop', emoji: '🎧', audiusGenre: 'Hip-Hop/Rap', color: '#FFD84A', ink: '#1F1700' },
  { id: 'trap', label: 'Trap', emoji: '🔥', audiusGenre: 'Trap', color: '#FF7A45', ink: '#240C00' },
  { id: 'electronic', label: 'Electronic', emoji: '⚡', audiusGenre: 'Electronic', color: '#4FD8FF', ink: '#00171F' },
  { id: 'house', label: 'House', emoji: '🪩', audiusGenre: 'House', color: '#FF5FD2', ink: '#24001A' },
  { id: 'dnb', label: 'Drum & Bass', emoji: '🥁', audiusGenre: 'Drum & Bass', color: '#7CFFB2', ink: '#00210E' },
  { id: 'lofi', label: 'Lo-Fi', emoji: '🌙', audiusGenre: 'Lo-Fi', color: '#A9B8FF', ink: '#0A0F26' },
  { id: 'hyperpop', label: 'Hyperpop', emoji: '💿', audiusGenre: 'Hyperpop', color: '#FF8FE9', ink: '#260021' },
  { id: 'alternative', label: 'Alt', emoji: '🎸', audiusGenre: 'Alternative', color: '#FF6B6B', ink: '#260404' },
  { id: 'experimental', label: 'Experimental', emoji: '🧪', audiusGenre: 'Experimental', color: '#C9F06B', ink: '#151F00' },
  { id: 'rnb', label: 'R&B', emoji: '🎤', audiusGenre: 'R&B/Soul', color: '#FFB86B', ink: '#261300' },
];

export function getGenre(id: GenreId): Genre {
  return GENRES.find((g) => g.id === id) ?? GENRES[0];
}

/** Artists above this follower count are not considered underground. */
export const UNDERGROUND_MAX_FOLLOWERS = 20_000;
