import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TopBar, type Tab } from '../components/TopBar';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { PlayScreen } from '../screens/PlayScreen';
import { DEMO } from '../services/demo';
import { colors, font } from '../theme';

export default function Home() {
  const [tab, setTab] = useState<Tab>('play');

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.frame}>
        {DEMO ? (
          <Text style={styles.demo}>Preview with demo tracks · the full app streams real underground artists</Text>
        ) : null}
        <View style={styles.header}>
          <TopBar
            tab={tab}
            onTab={setTab}
            onHelp={() => router.push('/how-to-play')}
            onSettings={() => router.push('/settings')}
          />
        </View>
        {/* Both tabs stay mounted so the current round survives a peek at the leaderboard. */}
        <View style={[styles.flex, tab !== 'play' && styles.hidden]}>
          <PlayScreen active={tab === 'play'} />
        </View>
        <View style={[styles.flex, tab !== 'leaderboard' && styles.hidden]}>
          <LeaderboardScreen active={tab === 'leaderboard'} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  flex: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
  demo: {
    color: colors.warn,
    fontSize: 12,
    fontWeight: font.bold,
    textAlign: 'center',
    paddingTop: 6,
    paddingHorizontal: 16,
  },
});
