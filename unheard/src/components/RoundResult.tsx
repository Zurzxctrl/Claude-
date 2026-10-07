import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_GUESSES } from '../game/config';
import { pointsFor, type RoundState } from '../game/logic';
import { guessGrid } from '../game/share';
import { trackUrl } from '../services/audius';
import { DEMO } from '../services/demo';
import { colors, font, radius } from '../theme';
import { Button, formatCount } from './ui';

export function RoundResult({
  round,
  visible,
  onClose,
  onNext,
  onShare,
}: {
  round: RoundState;
  visible: boolean;
  onClose: () => void;
  onNext: () => void;
  onShare: () => void;
}) {
  const insets = useSafeAreaInsets();
  const won = round.status === 'won';
  const points = pointsFor(round);
  const t = round.answer;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close result" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.handle} />
        <Text style={[styles.headline, { color: won ? colors.accent : colors.danger }]}>
          {won ? (round.guesses.length === 1 ? 'First try. Certified digger.' : 'Got it!') : 'Not this time'}
        </Text>
        <Text style={styles.sub}>
          {won ? `${round.guesses.length}/${MAX_GUESSES} guesses · +${points} pts` : 'The track was…'}
        </Text>

        <View style={styles.track}>
          {t.artwork ? (
            <Image source={t.artwork} style={styles.art} contentFit="cover" transition={200} />
          ) : (
            <View style={[styles.art, styles.artEmpty]}>
              <Feather name="disc" size={40} color={colors.textMuted} />
            </View>
          )}
          <View style={{ flex: 1, gap: 4 }}>
            <Text numberOfLines={2} style={styles.title}>
              {t.title}
            </Text>
            <Text numberOfLines={1} style={styles.artist}>
              {t.artist}
            </Text>
            <Text style={styles.meta}>
              {formatCount(t.followers)} followers{t.genre ? ` · ${t.genre}` : ''}
            </Text>
          </View>
        </View>

        <Text style={styles.grid}>{guessGrid(round.guesses)}</Text>

        <View style={styles.actions}>
          {DEMO ? null : (
            <Button
              label="Listen"
              icon="external-link"
              variant="secondary"
              onPress={() => Linking.openURL(trackUrl(t))}
              style={{ flex: 1 }}
            />
          )}
          <Button label="Share" icon="share" variant="secondary" onPress={onShare} style={{ flex: 1 }} />
        </View>
        <Button label="Next song" icon="arrow-right" onPress={onNext} />
        <Text style={styles.credit}>
          {DEMO ? 'Preview track made for this demo. The full app plays real artists from Audius.' : 'Support underground artists: follow them on Audius.'}
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 14,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    marginBottom: 6,
  },
  headline: {
    fontSize: 26,
    fontWeight: font.black,
    textAlign: 'center',
  },
  sub: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: font.bold,
    textAlign: 'center',
    marginTop: -8,
  },
  track: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 12,
  },
  art: {
    width: 88,
    height: 88,
    borderRadius: 12,
  },
  artEmpty: {
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: font.black,
  },
  artist: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: font.heavy,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: font.medium,
  },
  grid: {
    fontSize: 26,
    textAlign: 'center',
    letterSpacing: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  credit: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: font.medium,
    textAlign: 'center',
  },
});
