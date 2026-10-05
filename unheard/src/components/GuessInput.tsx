import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { searchTracks } from '../game/logic';
import type { Track } from '../game/types';
import { searchAudius } from '../services/audius';
import { colors, font, radius } from '../theme';
import { formatSeconds } from './ui';

const MAX_SUGGESTIONS = 6;

export function GuessInput({
  pool,
  disabledIds,
  onGuess,
  onSkip,
  skipGain,
}: {
  pool: Track[];
  disabledIds: string[];
  onGuess: (track: Track) => void;
  onSkip: () => void;
  /** Extra seconds the next clip unlocks, shown on the skip button. */
  skipGain: number | null;
}) {
  const [query, setQuery] = useState('');
  const [remote, setRemote] = useState<{ query: string; tracks: Track[] }>({ query: '', tracks: [] });
  const [focused, setFocused] = useState(false);
  const input = useRef<TextInput>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let cancelled = false;
    const t = setTimeout(() => {
      searchAudius(q)
        .then((tracks) => !cancelled && setRemote({ query: q, tracks }))
        .catch(() => {});
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const suggestions = useMemo(() => {
    const local = searchTracks(pool, query, MAX_SUGGESTIONS);
    const seen = new Set(local.map((t) => t.id));
    const fromSearch = remote.query === query.trim() ? remote.tracks : [];
    const merged = [...local, ...fromSearch.filter((t) => !seen.has(t.id))];
    return merged.filter((t) => !disabledIds.includes(t.id)).slice(0, MAX_SUGGESTIONS);
  }, [pool, query, remote, disabledIds]);

  const choose = (track: Track) => {
    setQuery('');
    input.current?.blur();
    onGuess(track);
  };

  const showList = focused && query.trim().length >= 2;

  return (
    <View style={styles.wrap}>
      {showList ? (
        <View style={styles.list}>
          {suggestions.length === 0 ? (
            <Text style={styles.empty}>No matches yet — keep typing</Text>
          ) : (
            suggestions.map((t) => (
              <Pressable
                key={t.id}
                accessibilityRole="button"
                accessibilityLabel={`Guess ${t.title} by ${t.artist}`}
                onPress={() => choose(t)}
                style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.surfaceRaised }]}
              >
                {t.artwork ? (
                  <Image source={t.artwork} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <Feather name="music" size={16} color={colors.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={styles.title}>
                    {t.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.artist}>
                    {t.artist}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
      <View style={styles.row}>
        <View style={[styles.search, focused && { borderColor: colors.borderStrong }]}>
          <Feather name="search" size={20} color={colors.textMuted} />
          <TextInput
            ref={input}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onSubmitEditing={() => suggestions[0] && choose(suggestions[0])}
            placeholder="Search a song…"
            placeholderTextColor={colors.textFaint}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            style={styles.input}
          />
          {query ? (
            <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={8}>
              <Feather name="x" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip this guess"
          onPress={onSkip}
          style={({ pressed }) => [styles.skip, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="skip-forward" size={18} color={colors.textMuted} />
          <Text style={styles.skipText}>{skipGain ? `+${formatSeconds(skipGain)}` : 'Skip'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  search: {
    flex: 1,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: font.bold,
    height: '100%',
    outlineStyle: 'none',
  } as object,
  skip: {
    height: 58,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: font.heavy,
  },
  list: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 68,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    paddingVertical: 6,
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  thumbEmpty: {
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: font.heavy,
  },
  artist: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: font.medium,
    marginTop: 2,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: font.bold,
    padding: 14,
    textAlign: 'center',
  },
});
