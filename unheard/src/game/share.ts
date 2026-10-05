import { MAX_GUESSES, type Difficulty, type Genre } from './config';
import type { Guess } from './types';

const SQUARES: Record<Guess['kind'], string> = {
  correct: '🟩',
  artist: '🟨',
  wrong: '🟥',
  skip: '⬛',
};

export function guessGrid(guesses: Guess[]): string {
  const filled = guesses.map((g) => SQUARES[g.kind]);
  while (filled.length < MAX_GUESSES) filled.push('⬜');
  return filled.join('');
}

export function shareText(opts: {
  guesses: Guess[];
  won: boolean;
  genre: Genre;
  difficulty: Difficulty;
  appUrl?: string;
}): string {
  const score = opts.won ? `${opts.guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  const difficulty = opts.difficulty[0].toUpperCase() + opts.difficulty.slice(1);
  return [
    `unheard 🎧 underground edition`,
    `${opts.genre.emoji} ${opts.genre.label} · ${difficulty} · ${score}`,
    guessGrid(opts.guesses),
    '',
    `Think you know the underground?${opts.appUrl ? ` ${opts.appUrl}` : ''}`,
  ].join('\n');
}

export function challengeText(appUrl?: string): string {
  return `I'm digging for underground tracks on unheard 🎧 Bet you can't name them faster than me.${appUrl ? ` ${appUrl}` : ''}`;
}
