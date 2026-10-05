import { describe, expect, it } from '@jest/globals';

import {
  applyRoundToStats,
  clipStart,
  evaluateGuess,
  newRound,
  pickTrack,
  pointsFor,
  roundReducer,
  searchTracks,
  unlockedClip,
  winRate,
} from '../src/game/logic';
import { guessGrid, shareText } from '../src/game/share';
import { cleanName, flagEmoji } from '../src/game/names';
import { CLIP_SCHEDULE, getGenre } from '../src/game/config';
import { EMPTY_STATS } from '../src/game/types';
import { track } from '../testing/fixtures';

const answer = track();
const sameArtist = track({ id: 'a2', title: 'Other Song' });
const stranger = track({ id: 'b1', title: 'Nope', artist: 'Someone Else', artistId: 'u9' });

describe('evaluateGuess', () => {
  it('marks the exact track correct', () => {
    expect(evaluateGuess(answer, answer).kind).toBe('correct');
  });

  it('gives partial credit for the right artist', () => {
    expect(evaluateGuess(answer, sameArtist).kind).toBe('artist');
    expect(evaluateGuess(answer, track({ id: 'a3', artistId: 'other', artist: 'NIGHTCRAWLER' })).kind).toBe('artist');
  });

  it('marks anything else wrong and keeps a label', () => {
    expect(evaluateGuess(answer, stranger)).toEqual({ kind: 'wrong', label: 'Nope — Someone Else', trackId: 'b1' });
  });
});

describe('roundReducer', () => {
  it('wins on a correct guess and stops accepting input', () => {
    let s = newRound(answer, 'easy');
    s = roundReducer(s, { type: 'skip' });
    s = roundReducer(s, { type: 'guess', track: answer });
    expect(s.status).toBe('won');
    expect(s.guesses.map((g) => g.kind)).toEqual(['skip', 'correct']);
    expect(roundReducer(s, { type: 'skip' })).toBe(s);
  });

  it('loses after five misses', () => {
    let s = newRound(answer, 'hard');
    for (let i = 0; i < 5; i++) s = roundReducer(s, { type: 'guess', track: stranger });
    expect(s.status).toBe('lost');
    expect(s.guesses).toHaveLength(5);
  });
});

describe('clips and scoring', () => {
  it('unlocks a longer clip after each guess and the full clip once the round ends', () => {
    let s = newRound(answer, 'medium');
    expect(unlockedClip(s)).toBe(CLIP_SCHEDULE.medium[0]);
    s = roundReducer(s, { type: 'skip' });
    expect(unlockedClip(s)).toBe(CLIP_SCHEDULE.medium[1]);
    s = roundReducer(s, { type: 'guess', track: answer });
    expect(unlockedClip(s)).toBe(CLIP_SCHEDULE.medium[4]);
  });

  it('scores by guess number and difficulty', () => {
    const firstTryHard = roundReducer(newRound(answer, 'hard'), { type: 'guess', track: answer });
    expect(pointsFor(firstTryHard)).toBe(15);

    let lastTryEasy = newRound(answer, 'easy');
    for (let i = 0; i < 4; i++) lastTryEasy = roundReducer(lastTryEasy, { type: 'skip' });
    lastTryEasy = roundReducer(lastTryEasy, { type: 'guess', track: answer });
    expect(pointsFor(lastTryEasy)).toBe(1);

    let lost = newRound(answer, 'hard');
    for (let i = 0; i < 5; i++) lost = roundReducer(lost, { type: 'skip' });
    expect(pointsFor(lost)).toBe(0);
  });

  it('starts clips past the intro but leaves room for the longest clip', () => {
    expect(clipStart(180, 'easy')).toBe(59);
    expect(clipStart(20, 'easy')).toBe(4);
    expect(clipStart(10, 'easy')).toBe(0);
  });
});

describe('stats', () => {
  it('tracks wins, streaks and distribution', () => {
    const win = roundReducer(newRound(answer, 'easy'), { type: 'guess', track: answer });
    let lose = newRound(answer, 'easy');
    for (let i = 0; i < 5; i++) lose = roundReducer(lose, { type: 'skip' });

    let stats = applyRoundToStats(EMPTY_STATS, win);
    stats = applyRoundToStats(stats, win);
    expect(stats).toMatchObject({ played: 2, wins: 2, currentStreak: 2, bestStreak: 2, points: 10 });
    stats = applyRoundToStats(stats, lose);
    expect(stats).toMatchObject({ played: 3, wins: 2, currentStreak: 0, bestStreak: 2 });
    expect(stats.distribution).toEqual([2, 0, 0, 0, 0, 1]);
    expect(winRate(stats)).toBe(67);
    expect(EMPTY_STATS.distribution).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('ignores rounds still in progress', () => {
    expect(applyRoundToStats(EMPTY_STATS, newRound(answer, 'easy'))).toBe(EMPTY_STATS);
  });
});

describe('pickTrack', () => {
  it('avoids recently played tracks when it can', () => {
    const pool = [answer, sameArtist, stranger];
    expect(pickTrack(pool, ['a1', 'a2'], () => 0.99)?.id).toBe('b1');
    expect(pickTrack(pool, ['a1', 'a2', 'b1'], () => 0)?.id).toBe('a1');
    expect(pickTrack([], [])).toBeNull();
  });
});

describe('searchTracks', () => {
  const pool = [answer, sameArtist, stranger, track({ id: 'c1', title: 'Tapes from the Basement', artist: 'Ghostline' })];

  it('matches title and artist, best matches first', () => {
    expect(searchTracks(pool, 'basement').map((t) => t.id)).toEqual(['a1', 'c1']);
    expect(searchTracks(pool, 'night').map((t) => t.id)).toEqual(['a1', 'a2']);
  });

  it('ignores case, accents and punctuation, and needs two characters', () => {
    expect(searchTracks(pool, 'BÁSEMENT tapes!').map((t) => t.id)).toEqual(['a1', 'c1']);
    expect(searchTracks(pool, 'b')).toEqual([]);
  });
});

describe('share', () => {
  it('builds an emoji grid padded to five', () => {
    expect(guessGrid([{ kind: 'wrong', label: '' }, { kind: 'artist', label: '' }, { kind: 'correct', label: '' }])).toBe(
      '🟥🟨🟩⬜⬜',
    );
  });

  it('writes share text with score and optional link', () => {
    const text = shareText({
      guesses: [{ kind: 'skip', label: '' }, { kind: 'correct', label: '' }],
      won: true,
      genre: getGenre('hiphop'),
      difficulty: 'hard',
      appUrl: 'https://example.com',
    });
    expect(text).toContain('Hip Hop · Hard · 2/5');
    expect(text).toContain('⬛🟩⬜⬜⬜');
    expect(text).toContain('https://example.com');
    expect(shareText({ guesses: [], won: false, genre: getGenre('underground'), difficulty: 'easy' })).toContain('X/5');
  });
});

describe('names', () => {
  it('makes flag emoji and cleans names', () => {
    expect(flagEmoji('us')).toBe('🇺🇸');
    expect(flagEmoji(null)).toBe('🌍');
    expect(cleanName('   Lo-Fi    Raccoon   ')).toBe('Lo-Fi Raccoon');
    expect(cleanName('x'.repeat(40))).toHaveLength(24);
  });
});
