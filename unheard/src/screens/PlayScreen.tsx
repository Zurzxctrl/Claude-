import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GenreChips } from '../components/GenreChips';
import { GuessInput } from '../components/GuessInput';
import { GuessSlots } from '../components/GuessSlots';
import { ClipBar, DifficultyPicker, PlayButton } from '../components/PlayControls';
import { RoundResult } from '../components/RoundResult';
import { Button, Card, Logo } from '../components/ui';
import { APP_URL } from '../config';
import { CLIP_SCHEDULE, getGenre, type Difficulty, type GenreId } from '../game/config';
import { clipStart, newRound, pickTrack, roundReducer, unlockedClip, type RoundAction, type RoundState } from '../game/logic';
import { shareText } from '../game/share';
import type { Track } from '../game/types';
import { useClipPlayer } from '../hooks/useClipPlayer';
import { fetchPool, streamUrl } from '../services/audius';
import { usePlayer } from '../state/PlayerContext';
import { colors, font } from '../theme';

function haptic(kind: 'success' | 'error' | 'tap') {
  if (Platform.OS === 'web') return;
  const run =
    kind === 'tap'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : Haptics.notificationAsync(
          kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
        );
  run.catch(() => {});
}

export function PlayScreen({ active }: { active: boolean }) {
  const insets = useSafeAreaInsets();
  const { ready, prefs, setPrefs, recordRound } = usePlayer();
  const [pools, setPools] = useState<Partial<Record<GenreId, Track[]>>>({});
  const [loadErrors, setLoadErrors] = useState<Partial<Record<GenreId, string>>>({});
  // One round per genre. A genre's first round is dealt when its pool arrives; later ones on "Next song".
  const [rounds, setRounds] = useState<Partial<Record<GenreId, RoundState>>>({});
  const [showResult, setShowResult] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loading = useRef(new Set<GenreId>());

  const genreId = prefs.genre;
  const pool = pools[genreId];
  const round = rounds[genreId] ?? null;
  const loadError = loadErrors[genreId] ?? null;

  const flash = useCallback((message: string) => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    setHint(message);
    hintTimer.current = setTimeout(() => setHint(null), 2200);
  }, []);

  const dealRound = useCallback(
    (id: GenreId, from: Track[], difficulty: Difficulty, recent: string[]) => {
      const track = pickTrack(from, recent);
      if (!track) return;
      setRounds((prev) => ({ ...prev, [id]: newRound(track, difficulty) }));
      setShowResult(false);
    },
    [],
  );

  const loadPool = useCallback(
    async (id: GenreId, difficulty: Difficulty, recent: string[]) => {
      if (loading.current.has(id)) return;
      loading.current.add(id);
      try {
        const tracks = await fetchPool(getGenre(id));
        if (tracks.length === 0) throw new Error('No playable tracks right now');
        setPools((prev) => ({ ...prev, [id]: tracks }));
        setLoadErrors((prev) => ({ ...prev, [id]: undefined }));
        dealRound(id, tracks, difficulty, recent);
      } catch (e) {
        setLoadErrors((prev) => ({ ...prev, [id]: e instanceof Error ? e.message : 'Could not reach Audius' }));
      } finally {
        loading.current.delete(id);
      }
    },
    [dealRound],
  );

  // Fetch the saved genre once prefs have loaded. Genre switches fetch from the chip handler.
  useEffect(() => {
    if (ready) loadPool(prefs.genre, prefs.difficulty, prefs.recent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const start = round ? clipStart(round.answer.duration, round.difficulty) : 0;
  const clip = useClipPlayer(round ? streamUrl(round.answer.id) : null, start);
  const { stop: stopClip } = clip;

  useEffect(() => {
    if (!active) stopClip();
  }, [active, stopClip]);

  const schedule = CLIP_SCHEDULE[round?.difficulty ?? prefs.difficulty];
  const unlocked = round ? unlockedClip(round) : schedule[0];
  const midRound = round?.status === 'playing' && round.guesses.length > 0;
  const finished = round != null && round.status !== 'playing';

  const nextSong = () => {
    if (pool) dealRound(genreId, pool, prefs.difficulty, prefs.recent);
  };

  const act = (action: RoundAction) => {
    if (!round) return;
    const next = roundReducer(round, action);
    stopClip();
    setRounds((prev) => ({ ...prev, [genreId]: next }));
    if (next.status !== 'playing') {
      recordRound(next, genreId);
      haptic(next.status === 'won' ? 'success' : 'error');
      setShowResult(true);
    } else {
      haptic(action.type === 'skip' ? 'tap' : 'error');
    }
  };

  const onGenre = (id: GenreId) => {
    if (id === genreId) return;
    if (midRound) return flash('Finish this track first — or skip to the end');
    stopClip();
    setPrefs({ genre: id });
    setShowResult(false);
    const existing = pools[id];
    const current = rounds[id];
    if (!existing) loadPool(id, prefs.difficulty, prefs.recent);
    else if (!current || current.status !== 'playing') dealRound(id, existing, prefs.difficulty, prefs.recent);
  };

  const onDifficulty = (d: Difficulty) => {
    if (d === prefs.difficulty) return;
    if (midRound) return flash('Difficulty locks once you start guessing');
    stopClip();
    setPrefs({ difficulty: d });
    if (round?.status === 'playing') setRounds((prev) => ({ ...prev, [genreId]: newRound(round.answer, d) }));
  };

  const retry = () => {
    setLoadErrors((prev) => ({ ...prev, [genreId]: undefined }));
    loadPool(genreId, prefs.difficulty, prefs.recent);
  };

  const share = () => {
    if (!round) return;
    Share.share({
      message: shareText({
        guesses: round.guesses,
        won: round.status === 'won',
        genre: getGenre(genreId),
        difficulty: round.difficulty,
        appUrl: APP_URL,
      }),
    }).catch(() => {});
  };

  const nextIndex = round ? Math.min(round.guesses.length + 1, schedule.length - 1) : 0;
  const skipGain = round && round.guesses.length < schedule.length - 1 ? schedule[nextIndex] - unlocked : null;

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <GenreChips value={genreId} onChange={onGenre} locked={midRound} />

        {loadError && !pool ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorTitle}>Can’t reach the underground</Text>
            <Text style={styles.errorBody}>{loadError}. Check your connection and try again.</Text>
            <Button label="Retry" icon="refresh-cw" onPress={retry} />
          </Card>
        ) : (
          <GuessSlots guesses={round?.guesses ?? []} active={round?.status === 'playing'} />
        )}

        <DifficultyPicker value={round?.difficulty ?? prefs.difficulty} onChange={onDifficulty} locked={midRound} />

        <ClipBar schedule={schedule} unlocked={unlocked} elapsed={clip.elapsed} />

        <View style={styles.status}>
          {!pool && !loadError ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.statusText}>Digging through the underground…</Text>
            </View>
          ) : clip.error ? (
            <Button label="This track won’t play — try another" variant="ghost" icon="refresh-cw" onPress={nextSong} />
          ) : hint ? (
            <Text style={[styles.statusText, { color: colors.warn }]}>{hint}</Text>
          ) : (
            <Logo size={30} />
          )}
        </View>

        <PlayButton
          clip={unlocked}
          playing={clip.isPlaying}
          waiting={!!round && (!clip.isLoaded || clip.isWaiting) && !clip.error}
          disabled={!round || !clip.isLoaded}
          onPress={() => (clip.isPlaying ? stopClip() : clip.play(unlocked))}
        />
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        {finished ? (
          <View style={styles.finishedRow}>
            <Button label="Result" icon="bar-chart-2" variant="secondary" onPress={() => setShowResult(true)} style={{ flex: 1 }} />
            <Button label="Next song" icon="arrow-right" onPress={nextSong} style={{ flex: 1.4 }} />
          </View>
        ) : (
          <GuessInput
            pool={pool ?? []}
            disabledIds={round?.guesses.flatMap((g) => (g.trackId ? [g.trackId] : [])) ?? []}
            onGuess={(track) => act({ type: 'guess', track })}
            onSkip={() => act({ type: 'skip' })}
            skipGain={skipGain}
          />
        )}
      </KeyboardAvoidingView>

      {round && finished ? (
        <RoundResult
          round={round}
          visible={showResult && active}
          onClose={() => setShowResult(false)}
          onNext={nextSong}
          onShare={share}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
    gap: 18,
  },
  status: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: font.heavy,
    textAlign: 'center',
  },
  bottom: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.bg,
  },
  finishedRow: {
    flexDirection: 'row',
    gap: 10,
  },
  errorCard: {
    padding: 20,
    gap: 10,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: font.black,
  },
  errorBody: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: font.medium,
    marginBottom: 6,
  },
});
