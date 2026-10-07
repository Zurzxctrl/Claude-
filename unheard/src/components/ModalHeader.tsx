import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CircleButton, Logo } from './ui';

export function ModalHeader() {
  return (
    <View style={styles.row}>
      <View style={styles.side} />
      <Logo size={30} />
      <View style={[styles.side, { alignItems: 'flex-end' }]}>
        <CircleButton
          icon="x"
          label="Close"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  side: {
    flex: 1,
  },
});
