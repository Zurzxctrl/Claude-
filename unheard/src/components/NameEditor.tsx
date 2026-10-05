import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { cleanName, randomName } from '../game/names';
import { colors, font, radius } from '../theme';
import { Button } from './ui';

export function NameEditor({
  visible,
  current,
  onSave,
  onClose,
}: {
  visible: boolean;
  current: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.center}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        {visible ? <NameForm current={current} onSave={onSave} onClose={onClose} /> : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function NameForm({ current, onSave, onClose }: { current: string; onSave: (name: string) => void; onClose: () => void }) {
  const [value, setValue] = useState(current);
  const cleaned = cleanName(value);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Your name</Text>
      <Text style={styles.sub}>Shown on the leaderboard. Keep it friendly.</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        maxLength={24}
        autoFocus
        autoCorrect={false}
        placeholder="Name"
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        onSubmitEditing={() => cleaned && (onSave(cleaned), onClose())}
      />
      <Button label="Random name" icon="shuffle" variant="secondary" onPress={() => setValue(randomName())} />
      <View style={styles.row}>
        <Button label="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
        <Button
          label="Save"
          disabled={!cleaned}
          onPress={() => {
            onSave(cleaned);
            onClose();
          }}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 20,
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: font.black,
  },
  sub: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: font.medium,
    marginTop: -6,
  },
  input: {
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bg,
    color: colors.text,
    fontSize: 18,
    fontWeight: font.heavy,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});
