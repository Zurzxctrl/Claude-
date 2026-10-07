import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ModalHeader } from '../components/ModalHeader';
import { Button, formatSeconds, type IconName } from '../components/ui';
import { CLIP_SCHEDULE, MAX_GUESSES, UNDERGROUND_MAX_FOLLOWERS } from '../game/config';
import { colors, font, radius } from '../theme';

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'disc',
    title: 'Pick a scene',
    body: `Every track comes from independent artists on Audius, mostly under ${(UNDERGROUND_MAX_FOLLOWERS / 1000).toFixed(0)}K followers. No radio hits.`,
  },
  {
    icon: 'play-circle',
    title: 'Hit play',
    body: `You get a tiny clip: ${formatSeconds(CLIP_SCHEDULE.easy[0])} on Easy, ${formatSeconds(CLIP_SCHEDULE.medium[0])} on Medium, ${formatSeconds(CLIP_SCHEDULE.hard[0])} on Hard.`,
  },
  {
    icon: 'search',
    title: 'Search and guess',
    body: `Every wrong guess or skip unlocks more of the clip. You have ${MAX_GUESSES} tries.`,
  },
  {
    icon: 'zap',
    title: 'Score',
    body: 'First try earns 5 points, last try earns 1. Medium doubles it, Hard triples it. Win in a row to build your streak.',
  },
];

const LEGEND: { color: string; dim: string; label: string }[] = [
  { color: colors.accent, dim: colors.accentDim, label: 'Correct' },
  { color: colors.warn, dim: colors.warnDim, label: 'Right artist, wrong song' },
  { color: colors.danger, dim: colors.dangerDim, label: 'Wrong' },
];

export default function HowToPlay() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <ModalHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Name the underground track before anyone else.</Text>
        {STEPS.map((s, i) => (
          <View key={s.title} style={styles.step}>
            <View style={styles.badge}>
              <Feather name={s.icon} size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.stepTitle}>
                {i + 1}. {s.title}
              </Text>
              <Text style={styles.stepBody}>{s.body}</Text>
            </View>
          </View>
        ))}
        <View style={styles.legend}>
          {LEGEND.map((l) => (
            <View key={l.label} style={[styles.legendRow, { backgroundColor: l.dim, borderColor: l.color }]}>
              <View style={[styles.dot, { backgroundColor: l.color }]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>
        <Button label="Let's dig" icon="play" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 20,
    gap: 20,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: font.black,
  },
  step: {
    flexDirection: 'row',
    gap: 14,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: font.black,
  },
  stepBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: font.medium,
  },
  legend: {
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 46,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: font.heavy,
  },
});
