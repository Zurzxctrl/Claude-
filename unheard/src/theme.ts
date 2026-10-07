import { Platform } from 'react-native';

export const colors = {
  bg: '#0B0C0B',
  surface: '#161816',
  surfaceRaised: '#1E211E',
  border: '#2A2E2A',
  borderStrong: '#3A3F3A',
  text: '#F4F6F3',
  textMuted: '#9AA19A',
  textFaint: '#5C635C',
  accent: '#B8FF3C',
  accentInk: '#0B1400',
  accentDim: '#2C3D10',
  danger: '#FF5A4E',
  dangerDim: '#3A1714',
  warn: '#FFC93C',
  warnDim: '#3A2E10',
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
};

export const font = {
  family: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
  }),
  black: '900' as const,
  heavy: '800' as const,
  bold: '700' as const,
  medium: '500' as const,
};
