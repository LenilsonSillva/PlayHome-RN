import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // --- FUNDOS (O Vácuo) ---
  background: '#020617',
  surface: '#0f172a',      // Cards e Containers
  surfaceLight: '#1e293b', // Inputs e destaque de cards
  
  // --- IDENTIDADE (Neon) ---
  danger: '#ff003c',       // Vermelho Impostor
  dangerDark: '#450a0a',   // Fundo de botão de perigo
  
  cyan: '#00f2ff',         // Tech / Ciano
  cyanDark: '#083344',     // Fundo de botão tech
  
  amber: '#facc15',        // Avisos / Sabotagem
  amberDark: '#422006',
  
  blue: '#3b82f6',         // Sistemas / Plasma
  blueDark: '#1e3a8a',

  // --- TEXTO ---
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',    // Texto desabilitado ou sombra
  
  // --- STATUS ---
  success: '#10b981',
  error: '#ef4444',
  
  // --- GLASSMORPHISM (Opacidades Úteis) ---
  white10: 'rgba(255, 255, 255, 0.1)',
  white05: 'rgba(255, 255, 255, 0.05)',
  cyan20: 'rgba(0, 242, 255, 0.2)',
  danger20: 'rgba(255, 0, 60, 0.2)',
  
  black: '#000000',
  white: '#ffffff',
  transparent: 'transparent',
  greenLight: '#08ff14'
} as const;

export const SPACING = {
  xs: 4, 
  sm: 8, 
  md: 16, 
  lg: 24, 
  xl: 32,
  xxl: 48, // Espaçamento extra para seções
} as const;

export const THEME = {
  colors: COLORS,
  spacing: SPACING,
  screen: { width, height },
  radius: {
    small: 8,
    medium: 12,
    large: 24, // Aumentei um pouco para cards mais modernos
    full: 9999,
  },
  // --- SOMBRAS ESTILIZADAS (Efeito Glow) ---
  shadows: {
    cyan: {
      shadowColor: COLORS.cyan,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 15,
      elevation: 10,
    },
    danger: {
      shadowColor: COLORS.danger,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 15,
      elevation: 10,
    }
  },
  // --- AJUSTES DE PLATAFORMA ---
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
};