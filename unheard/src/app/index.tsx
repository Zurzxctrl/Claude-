import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TopBar, type Tab } from '../components/TopBar';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { PlayScreen } from '../screens/PlayScreen';
import { colors } from '../theme';

export default function Home() {
  const [tab, setTab] = useState<Tab>('play');

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.frame}>
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
});
