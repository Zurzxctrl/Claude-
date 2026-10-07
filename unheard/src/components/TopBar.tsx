import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { colors, font, radius } from '../theme';
import { CircleButton, type IconName } from './ui';

export type Tab = 'play' | 'leaderboard';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'play', label: 'Play', icon: 'play' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'award' },
];

export function TopBar({
  tab,
  onTab,
  onHelp,
  onSettings,
}: {
  tab: Tab;
  onTab: (tab: Tab) => void;
  onHelp: () => void;
  onSettings: () => void;
}) {
  // Narrow phones drop the tab icons so "Leaderboard" never truncates.
  const showIcons = useWindowDimensions().width >= 380;
  return (
    <View style={styles.row}>
      <CircleButton icon="help-circle" label="How to play" onPress={onHelp} size={48} />
      <View style={styles.segment} accessibilityRole="tablist">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <Pressable
              key={t.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onTab(t.id)}
              style={[styles.tab, active && styles.tabActive]}
            >
              {showIcons ? <Feather name={t.icon} size={16} color={active ? colors.accentInk : colors.textMuted} /> : null}
              <Text numberOfLines={1} style={[styles.tabText, { color: active ? colors.accentInk : colors.textMuted }]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <CircleButton icon="settings" label="Settings" onPress={onSettings} size={48} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 4,
    height: 50,
  },
  tab: {
    flexGrow: 1,
    flexBasis: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
  },
  tabActive: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  tabText: {
    fontSize: 15,
    fontWeight: font.heavy,
  },
});
