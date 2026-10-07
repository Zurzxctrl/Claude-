import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { DIFFICULTIES, type Difficulty } from '../game/config';
import { colors, font, radius } from '../theme';
import { formatSeconds } from './ui';

export function DifficultyPicker({
  value,
  onChange,
  locked,
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  locked?: boolean;
}) {
  return (
    <View style={styles.diffRow}>
      {DIFFICULTIES.map((d) => {
        const active = d.id === value;
        return (
          <Pressable
            key={d.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: locked && !active }}
            accessibilityLabel={`${d.label} difficulty`}
            onPress={() => onChange(d.id)}
            style={[
              styles.diff,
              active
                ? { backgroundColor: d.color, shadowColor: d.color, shadowOpacity: 0.5, shadowRadius: 12, elevation: 4 }
                : { backgroundColor: d.dim },
              { opacity: locked && !active ? 0.4 : 1 },
            ]}
          >
            <Text style={[styles.diffText, { color: active ? colors.bg : d.color }]}>{d.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Segmented timeline: ticks mark each unlock point, the dim fill is what's unlocked, bright fill is playback. */
export function ClipBar({ schedule, unlocked, elapsed }: { schedule: readonly number[]; unlocked: number; elapsed: number }) {
  const total = schedule[schedule.length - 1];
  return (
    <View style={styles.bar} accessibilityLabel={`${formatSeconds(unlocked)} of audio unlocked`}>
      <View style={[styles.barUnlocked, { width: `${(unlocked / total) * 100}%` }]} />
      <View style={[styles.barFill, { width: `${(elapsed / total) * 100}%` }]} />
      {schedule.slice(0, -1).map((s) => (
        <View key={s} style={[styles.tick, { left: `${(s / total) * 100}%` }]} />
      ))}
    </View>
  );
}

export function PlayButton({
  onPress,
  playing,
  waiting,
  disabled,
  clip,
}: {
  onPress: () => void;
  playing: boolean;
  waiting: boolean;
  disabled?: boolean;
  clip: number;
}) {
  return (
    <View style={styles.playRow}>
      <View style={styles.side} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Stop clip' : `Play ${formatSeconds(clip)} clip`}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.play, { opacity: disabled ? 0.35 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
      >
        {waiting ? (
          <ActivityIndicator color={colors.accentInk} size="large" />
        ) : (
          <Feather
            name={playing ? 'square' : 'play'}
            size={playing ? 40 : 52}
            color={colors.accentInk}
            style={playing ? undefined : { marginLeft: 8 }}
          />
        )}
      </Pressable>
      <View style={styles.side}>
        <Text style={styles.clip}>{formatSeconds(clip)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  diffRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  diff: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
  },
  diffText: {
    fontSize: 15,
    fontWeight: font.heavy,
  },
  bar: {
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  barUnlocked: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.borderStrong,
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.accent,
  },
  tick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: colors.bg,
  },
  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  side: {
    flex: 1,
    alignItems: 'center',
  },
  play: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.55,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  clip: {
    fontSize: 28,
    fontWeight: font.black,
    color: colors.accent,
  },
});
