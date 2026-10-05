import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { GENRES, type GenreId } from '../game/config';
import { font, radius } from '../theme';

export function GenreChips({
  value,
  onChange,
  locked,
}: {
  value: GenreId;
  onChange: (id: GenreId) => void;
  locked?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroller}
    >
      {GENRES.map((g) => {
        const active = g.id === value;
        return (
          <Pressable
            key={g.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: locked && !active }}
            accessibilityLabel={`${g.label} genre`}
            onPress={() => onChange(g.id)}
            style={({ pressed }) => [
              styles.chip,
              active
                ? { backgroundColor: g.color, shadowColor: g.color, shadowOpacity: 0.55, shadowRadius: 14, elevation: 5 }
                : { backgroundColor: `${g.color}1F` },
              { opacity: locked && !active ? 0.4 : pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.emoji}>{g.emoji}</Text>
            <Text style={[styles.label, { color: active ? g.ink : g.color }]}>{g.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: {
    flexGrow: 0,
    marginHorizontal: -16,
  },
  row: {
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 46,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    shadowOffset: { width: 0, height: 0 },
  },
  emoji: {
    fontSize: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: font.heavy,
  },
});
