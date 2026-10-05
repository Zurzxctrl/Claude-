import { StyleSheet, Text, View } from 'react-native';

import { avatarColor, avatarEmoji } from '../game/names';

export function Avatar({ index, size = 48 }: { index: number; size?: number }) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(index) },
      ]}
    >
      <Text style={{ fontSize: size * 0.52 }}>{avatarEmoji(index)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
