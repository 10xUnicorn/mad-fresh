export const colors = {
  green: '#3d6b2a',
  greenLight: '#5aaa3c',
  greenAccent: '#75F663',

  bg: '#faf8f3',
  bgAlt: '#f2efe8',
  surface: '#ffffff',
  warm: '#fff8ee',
  warmBorder: '#f0ddb8',

  textPrimary: '#1e2d18',
  textSecondary: '#4a5e3a',
  textMuted: '#7a7060',
  textFaint: '#9a9080',
  textWhite: '#ffffff',

  border: '#ddd8cc',
  borderFocus: '#3d6b2a',

  success: '#3d6b2a',
  successBg: '#e9f0e4',
  warning: '#b45309',
  warningBg: '#fff8ee',
  error: '#dc2626',
  errorBg: '#fef2f2',
  info: '#2563eb',
  infoBg: '#eff6ff',
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const font = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;
