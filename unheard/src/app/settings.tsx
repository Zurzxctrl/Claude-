import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ModalHeader } from '../components/ModalHeader';
import { NameEditor } from '../components/NameEditor';
import type { IconName } from '../components/ui';
import { APP_URL, CONTACT_EMAIL, PRIVACY_URL, TERMS_URL } from '../config';
import { challengeText } from '../game/share';
import { usePlayer } from '../state/PlayerContext';
import { colors, font, radius } from '../theme';

type Row = {
  icon: IconName;
  label: string;
  detail?: string;
  danger?: boolean;
  highlight?: boolean;
  onPress: () => void;
};

function confirm(title: string, message: string, action: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: action, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  if (rows.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.group}>
        {rows.map((r, i) => {
          const tint = r.danger ? colors.danger : r.highlight ? colors.accent : colors.text;
          return (
            <Pressable
              key={r.label}
              accessibilityRole="button"
              onPress={r.onPress}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceRaised }]}
            >
              <View
                style={[
                  styles.iconBox,
                  r.danger && { backgroundColor: colors.dangerDim },
                  r.highlight && { backgroundColor: colors.accentDim },
                ]}
              >
                <Feather name={r.icon} size={22} color={tint} />
              </View>
              <View style={[styles.rowBody, i > 0 && styles.divider]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: tint }]}>{r.label}</Text>
                  {r.detail ? (
                    <Text numberOfLines={1} style={styles.rowDetail}>
                      {r.detail}
                    </Text>
                  ) : null}
                </View>
                <Feather name="chevron-right" size={22} color={colors.textMuted} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function Settings() {
  const { profile, setName, resetEverything } = usePlayer();
  const [editing, setEditing] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const legal: Row[] = [];
  if (TERMS_URL) legal.push({ icon: 'file-text', label: 'Terms of use', onPress: () => Linking.openURL(TERMS_URL) });
  if (PRIVACY_URL) legal.push({ icon: 'shield', label: 'Privacy policy', onPress: () => Linking.openURL(PRIVACY_URL) });
  if (CONTACT_EMAIL) legal.push({ icon: 'mail', label: 'Contact us', onPress: () => Linking.openURL(`mailto:${CONTACT_EMAIL}`) });

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <ModalHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <Section
          title="Profile"
          rows={[
            {
              icon: 'user',
              label: profile.name,
              detail: 'Tap to change the name on the leaderboard',
              highlight: true,
              onPress: () => setEditing(true),
            },
          ]}
        />
        <Section
          title="Game"
          rows={[
            { icon: 'help-circle', label: 'How to play', onPress: () => router.push('/how-to-play') },
            {
              icon: 'share-2',
              label: 'Share app',
              onPress: () => Share.share({ message: challengeText(APP_URL) }).catch(() => {}),
            },
          ]}
        />
        <Section
          title="Music"
          rows={[
            {
              icon: 'headphones',
              label: 'Music from Audius',
              detail: 'Every track streams from independent artists',
              onPress: () => Linking.openURL('https://audius.co'),
            },
          ]}
        />
        <Section
          title="Data"
          rows={[
            {
              icon: 'trash-2',
              label: 'Reset stats & profile',
              danger: true,
              onPress: async () => {
                const ok = await confirm(
                  'Reset everything?',
                  'This clears your stats, streaks and leaderboard scores. It cannot be undone.',
                  'Reset',
                );
                if (ok) {
                  await resetEverything();
                  router.back();
                }
              },
            },
          ]}
        />
        <Section title="Legal" rows={legal} />
        <Text style={styles.version}>Version {version}</Text>
      </ScrollView>
      <NameEditor visible={editing} current={profile.name} onSave={setName} onClose={() => setEditing(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 26,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: font.black,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginLeft: 14,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 14,
    paddingRight: 14,
    paddingVertical: 18,
  },
  divider: {
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
  },
  rowLabel: {
    fontSize: 17,
    fontWeight: font.heavy,
  },
  rowDetail: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: font.medium,
    marginTop: 3,
  },
  version: {
    color: colors.textFaint,
    fontSize: 14,
    fontWeight: font.bold,
    textAlign: 'center',
  },
});
