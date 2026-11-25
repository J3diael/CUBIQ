/**
 * Design tokens: the single source of truth for colours, spacing, shape, type and motion.
 * Components never hard-code these values; they read them through `useTheme()`.
 */

export const palette = {
  dark: {
    background: '#0B0B0F',
    surface: '#16161C',
    surfaceRaised: '#1F1F27',
    border: '#2A2A33',
    textPrimary: '#F2F2F5',
    textSecondary: '#9A9AA6',
    textOnAccent: '#0B0B0F',
    accent: '#7C8CFF',
    accentMuted: 'rgba(124, 140, 255, 0.16)',
    timerReady: '#3DDC97',
    timerHolding: '#F5B83D',
    success: '#3DDC97',
    warning: '#F5B83D',
    danger: '#FF6B6B',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
  light: {
    background: '#F7F7F9',
    surface: '#FFFFFF',
    surfaceRaised: '#F0F0F4',
    border: '#E3E3E8',
    textPrimary: '#111116',
    textSecondary: '#5E5E6A',
    textOnAccent: '#FFFFFF',
    accent: '#4F5BD5',
    accentMuted: 'rgba(79, 91, 213, 0.12)',
    timerReady: '#12A86B',
    timerHolding: '#C98A0B',
    success: '#12A86B',
    warning: '#C98A0B',
    danger: '#D93838',
    overlay: 'rgba(17, 17, 22, 0.4)',
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type ColorToken = keyof (typeof palette)['dark'];
export type Colors = Record<ColorToken, string>;

/** 4-point spacing scale. */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 999,
} as const;

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  mono: 'JetBrainsMono_500Medium',
} as const;

/** Type scale. Line heights are fixed so layouts don't shift between fonts. */
export const typography = {
  display: { fontFamily: fontFamily.bold, fontSize: 32, lineHeight: 40 },
  title: { fontFamily: fontFamily.semibold, fontSize: 22, lineHeight: 28 },
  heading: { fontFamily: fontFamily.semibold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fontFamily.medium, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 18 },
  overline: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  timer: { fontFamily: fontFamily.mono, fontSize: 72, lineHeight: 84 },
  stat: { fontFamily: fontFamily.mono, fontSize: 20, lineHeight: 26 },
} as const;

export type TypographyVariant = keyof typeof typography;

export const motion = {
  fast: 150,
  normal: 200,
  slow: 250,
} as const;

/** Minimum touch target size, in density-independent pixels. */
export const touchTarget = 44;
