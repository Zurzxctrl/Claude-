import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { MAX_GUESSES } from '../game/config';
import type { Guess } from '../game/types';
import { colors, font, radius } from '../theme';
import type { IconName } from './ui';

const KIND_STYLE: Record<Guess['kind'], { bg: string; border: string; fg: string; icon: IconName }> = {
  correct: { bg: colors.accentDim, border: colors.accent, fg: colors.accent, icon: 'check' },
  artist: { bg: colors.warnDim, border: colors.warn, fg: colors.warn, icon: 'user' },
  wrong: { bg: colors.dangerDim, border: colors.danger, fg: colors.danger, icon: 'x' },
  skip: { bg: colors.surface, border: colors.border, fg: colors.textMuted, icon: 'skip-forward' },
};

export function GuessSlots({ guesses, active }: { guesses: Guess[]; active: boolean }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: MAX_GUESSES }, (_, i) => {
        const guess = guesses[i];
        if (guess) {
          const k = KIND_STYLE[guess.kind];
          return (
            <View key={i} style={[styles.slot, { backgroundColor: k.bg, borderColor: k.border }]}>
              <Feather name={k.icon} size={18} color={k.fg} />
              <Text numberOfLines={1} style={[styles.guessText, { color: guess.kind === 'skip' ? colors.textMuted : colors.text }]}>
                {guess.label}
              </Text>
              {guess.kind === 'artist' ? <Text style={[styles.tag, { color: k.fg }]}>Right artist</Text> : null}
            </View>
          );
        }
        const current = active && i === guesses.length;
        return (
          <View key={i} style={[styles.slot, styles.empty, current && styles.current]}>
            <Text style={[styles.placeholder, { color: current ? colors.textMuted : colors.textFaint }]}>
              # Guess {i + 1}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  slot: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  empty: {
    backgroundColor: colors.surface,
    borderColor: colors.surface,
    justifyContent: 'center',
  },
  current: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.bg,
  },
  placeholder: {
    fontSize: 16,
    fontWeight: font.bold,
  },
  guessText: {
    flex: 1,
    fontSize: 15,
    fontWeight: font.bold,
  },
  tag: {
    fontSize: 12,
    fontWeight: font.heavy,
  },
});
