import { CLIP_SCHEDULE, DIFFICULTY_MULTIPLIER, MAX_GUESSES, type Difficulty } from './config';
import type { Guess, RoundStatus, Stats, Track } from './types';

export type RoundState = {
  answer: Track;
  difficulty: Difficulty;
  guesses: Guess[];
  status: RoundStatus;
};

export type RoundAction = { type: 'guess'; track: Track } | { type: 'skip' };

export function newRound(answer: Track, difficulty: Difficulty): RoundState {
  return { answer, difficulty, guesses: [], status: 'playing' };
}

export function trackLabel(track: Pick<Track, 'title' | 'artist'>): string {
  return `${track.title} — ${track.artist}`;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function evaluateGuess(answer: Track, guess: Track): Guess {
  const label = trackLabel(guess);
  const trackId = guess.id;
  if (guess.id === answer.id) return { kind: 'correct', label, trackId };
  if (
    guess.artistId === answer.artistId ||
    (normalize(guess.artist) !== '' && normalize(guess.artist) === normalize(answer.artist))
  ) {
    return { kind: 'artist', label, trackId };
  }
  return { kind: 'wrong', label, trackId };
}

export function roundReducer(state: RoundState, action: RoundAction): RoundState {
  if (state.status !== 'playing') return state;
  const guess: Guess =
    action.type === 'skip' ? { kind: 'skip', label: 'Skipped' } : evaluateGuess(state.answer, action.track);
  const guesses = [...state.guesses, guess];
  let status: RoundStatus = 'playing';
  if (guess.kind === 'correct') status = 'won';
  else if (guesses.length >= MAX_GUESSES) status = 'lost';
  return { ...state, guesses, status };
}

/** Seconds of audio the player may hear right now. Reveals the longest clip once the round ends. */
export function unlockedClip(state: Pick<RoundState, 'difficulty' | 'guesses' | 'status'>): number {
  const schedule = CLIP_SCHEDULE[state.difficulty];
  if (state.status !== 'playing') return schedule[schedule.length - 1];
  return schedule[Math.min(state.guesses.length, schedule.length - 1)];
}

export function pointsFor(state: Pick<RoundState, 'difficulty' | 'guesses' | 'status'>): number {
  if (state.status !== 'won') return 0;
  const guessIndex = state.guesses.length - 1;
  return (MAX_GUESSES - guessIndex) * DIFFICULTY_MULTIPLIER[state.difficulty];
}

/**
 * Where in the track the clip starts. Skips intros by starting about a third of the way in,
 * while leaving room for the longest clip before the end.
 */
export function clipStart(durationSec: number, difficulty: Difficulty): number {
  const schedule = CLIP_SCHEDULE[difficulty];
  const longest = schedule[schedule.length - 1];
  const latest = Math.max(0, durationSec - longest - 1);
  return Math.min(Math.round(durationSec * 0.33), latest);
}

export function applyRoundToStats(stats: Stats, state: RoundState): Stats {
  if (state.status === 'playing') return stats;
  const won = state.status === 'won';
  const distribution = [...stats.distribution];
  distribution[won ? state.guesses.length - 1 : MAX_GUESSES] += 1;
  const currentStreak = won ? stats.currentStreak + 1 : 0;
  return {
    played: stats.played + 1,
    wins: stats.wins + (won ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    points: stats.points + pointsFor(state),
    distribution,
  };
}

export function winRate(stats: Stats): number {
  return stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100);
}

/** Pick a random track, avoiding anything in `recent` when possible. */
export function pickTrack(pool: Track[], recent: string[], random: () => number = Math.random): Track | null {
  if (pool.length === 0) return null;
  const fresh = pool.filter((t) => !recent.includes(t.id));
  const from = fresh.length > 0 ? fresh : pool;
  return from[Math.floor(random() * from.length)];
}

export function searchTracks(pool: Track[], query: string, limit = 6): Track[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const terms = q.split(' ');
  const scored: { track: Track; score: number }[] = [];
  for (const track of pool) {
    const title = normalize(track.title);
    const artist = normalize(track.artist);
    const hay = `${title} ${artist}`;
    if (!terms.every((t) => hay.includes(t))) continue;
    const score = title.startsWith(q) ? 0 : title.includes(q) ? 1 : artist.startsWith(q) ? 2 : 3;
    scored.push({ track, score });
  }
  return scored
    .sort((a, b) => a.score - b.score || a.track.title.localeCompare(b.track.title))
    .slice(0, limit)
    .map((s) => s.track);
}
