import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { NameEditor } from '../components/NameEditor';
import { Button, Card } from '../components/ui';
import { APP_URL } from '../config';
import { winRate } from '../game/logic';
import { flagEmoji } from '../game/names';
import { challengeText } from '../game/share';
import {
  fetchLeaderboard,
  fetchMyRank,
  leaderboardEnabled,
  type LeaderboardRow,
  type MyRank,
  type Period,
} from '../services/leaderboard';
import { usePlayer } from '../state/PlayerContext';
import { colors, font, radius } from '../theme';

const MEDALS = ['🥇', '🥈', '🥉'];

function Pill({ label, active, onPress, icon }: { label: string; active: boolean; onPress: () => void; icon?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}
    >
      {icon ? <Text style={{ fontSize: 16 }}>{icon}</Text> : null}
      <Text style={[styles.pillText, { color: active ? colors.accentInk : colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

function Stat({ value, label, icon }: { value: string; label: string; icon?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>
        {icon ? <Text style={{ fontSize: 18 }}>{icon} </Text> : null}
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function LeaderboardScreen({ active }: { active: boolean }) {
  const insets = useSafeAreaInsets();
  const { profile, stats, syncVersion, setName } = usePlayer();
  const [scope, setScope] = useState<'world' | 'country'>('world');
  const [period, setPeriod] = useState<Period>('week');
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [me, setMe] = useState<MyRank>(null);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(false);

  const country = scope === 'country' ? profile.country : null;

  useEffect(() => {
    if (!leaderboardEnabled || !active) return;
    let cancelled = false;
    Promise.all([fetchLeaderboard(period, country), fetchMyRank(period, country).catch(() => null)])
      .then(([list, mine]) => {
        if (cancelled) return;
        setRows(list);
        setMe(mine);
        setError(false);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [active, period, country, syncVersion]);

  const subtitle = me ? `#${me.rank.toLocaleString()} · ${me.points.toLocaleString()} pts` : `${stats.points.toLocaleString()} pts`;

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]} showsVerticalScrollIndicator={false}>
        <Card style={styles.profile}>
          <Pressable
            style={styles.profileTop}
            onPress={() => setEditing(true)}
            accessibilityRole="button"
            accessibilityLabel="Edit your name"
          >
            <Avatar index={profile.avatar} size={68} />
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text numberOfLines={1} style={styles.name}>
                  {profile.name}
                </Text>
                <Feather name="edit-2" size={18} color={colors.textMuted} />
              </View>
              <Text style={styles.rank}>{subtitle}</Text>
            </View>
          </Pressable>
          <View style={styles.stats}>
            <Stat value={String(stats.played)} label="Played" />
            <Stat value={`${winRate(stats)}%`} label="Win rate" />
            <Stat value={String(stats.currentStreak)} label="Streak" icon="🔥" />
            <Stat value={String(stats.bestStreak)} label="Best streak" />
          </View>
        </Card>

        <View style={styles.filters}>
          <View style={styles.filterGroup}>
            <Pill label="World" icon="🌍" active={scope === 'world'} onPress={() => setScope('world')} />
            {profile.country ? (
              <Pill
                label={profile.country}
                icon={flagEmoji(profile.country)}
                active={scope === 'country'}
                onPress={() => setScope('country')}
              />
            ) : null}
          </View>
          <View style={styles.filterGroup}>
            <Pill label="This week" active={period === 'week'} onPress={() => setPeriod('week')} />
            <Pill label="All time" active={period === 'all'} onPress={() => setPeriod('all')} />
          </View>
        </View>

        {!leaderboardEnabled ? (
          <Card style={styles.notice}>
            <Text style={styles.noticeTitle}>Global rankings are coming soon</Text>
            <Text style={styles.noticeBody}>Your stats are saved on this device and will count once rankings go live.</Text>
          </Card>
        ) : error ? (
          <Card style={styles.notice}>
            <Text style={styles.noticeTitle}>Couldn’t load the leaderboard</Text>
            <Text style={styles.noticeBody}>Check your connection and switch tabs to retry.</Text>
          </Card>
        ) : rows === null ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 30 }} />
        ) : rows.length === 0 ? (
          <Card style={styles.notice}>
            <Text style={styles.noticeTitle}>No scores yet</Text>
            <Text style={styles.noticeBody}>Win a round and you’re on the board.</Text>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {rows.map((r) => (
              <View key={r.playerId} style={styles.row}>
                <View style={styles.place}>
                  {r.rank <= 3 ? (
                    <Text style={{ fontSize: 22 }}>{MEDALS[r.rank - 1]}</Text>
                  ) : (
                    <Text style={styles.placeText}>{r.rank}</Text>
                  )}
                </View>
                <Avatar index={r.avatar} size={46} />
                <Text numberOfLines={1} style={styles.rowName}>
                  {r.name}
                </Text>
                <Text style={{ fontSize: 18 }}>{flagEmoji(r.country)}</Text>
                <Text style={styles.rowPoints}>{r.points.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View pointerEvents="box-none" style={[styles.floating, { bottom: insets.bottom + 16 }]}>
        <Button
          label="Challenge a friend"
          icon="share-2"
          onPress={() => Share.share({ message: challengeText(APP_URL) }).catch(() => {})}
          style={styles.challenge}
        />
      </View>

      <NameEditor visible={editing} current={profile.name} onSave={setName} onClose={() => setEditing(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 16,
  },
  profile: {
    padding: 16,
    gap: 16,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: font.black,
    flexShrink: 1,
  },
  rank: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: font.heavy,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: font.black,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: font.bold,
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    rowGap: 10,
    columnGap: 6,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    height: 42,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillActive: {
    backgroundColor: colors.accent,
  },
  pillIdle: {
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pillText: {
    fontSize: 14,
    fontWeight: font.heavy,
  },
  notice: {
    padding: 20,
    gap: 6,
  },
  noticeTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: font.black,
  },
  noticeBody: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: font.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  place: {
    width: 30,
    alignItems: 'center',
  },
  placeText: {
    color: colors.textMuted,
    fontSize: 17,
    fontWeight: font.black,
  },
  rowName: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: font.heavy,
  },
  rowPoints: {
    color: colors.text,
    fontSize: 18,
    fontWeight: font.black,
    minWidth: 56,
    textAlign: 'right',
  },
  floating: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  challenge: {
    paddingHorizontal: 28,
  },
});
