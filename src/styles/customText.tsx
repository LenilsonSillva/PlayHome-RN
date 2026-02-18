import React from 'react';
import { Text, TextStyle, StyleSheet, StyleProp, TextProps } from 'react-native';
import { COLORS } from './theme';

// Agora com h3 incluído
type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'label' | 'hint';

interface CustomTextProps extends TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  style?: StyleProp<TextStyle>;
}

export const CustomText = ({ 
  children, 
  variant = 'body', 
  style, 
  ...rest 
}: CustomTextProps) => {
  return (
    <Text style={[textStyles[variant], style]} {...rest}>
      {children}
    </Text>
  );
};

const textStyles: Record<TextVariant, TextStyle> = StyleSheet.create({
  h1: { fontSize: 36, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -1 },
  h2: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  h3: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  body: { fontSize: 16, color: COLORS.textSecondary },
  label: { fontSize: 12, fontWeight: '800', color: COLORS.cyan, textTransform: 'uppercase', letterSpacing: 2 },
  hint: { fontSize: 14, color: COLORS.amber, fontStyle: 'italic' }
});