import { COLORS } from '../../../styles/theme';

export const IMPOSTOR_THEME = {
  primary: COLORS.danger,
  secondary: COLORS.surface,
  accent: COLORS.amber,
  // Para ser usado em botões ou indicadores de perigo
  glow: 'rgba(255, 0, 60, 0.4)',
  gradient: [COLORS.danger, '#7f1d1d'] as [string, string]
};