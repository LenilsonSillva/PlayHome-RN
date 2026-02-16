import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type AvatarProps = {
  emoji: string;
  color: string;
  size?: number;
  hideScan?: boolean;
  bgColor?: string;
  borderRadius?: number;
};

export function PlayerAvatar({
  emoji,
  color,
  size = 40,
  hideScan = false,
  bgColor,
  borderRadius
}: AvatarProps) {
  const width = size;
  const height = size * 1.33;
  const retroGreen = "#00ff41";

  // Controle da animação do scanner
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!hideScan) {
      // Loop infinito da linha subindo e descendo
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 2500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnim.setValue(0);
    }
  }, [hideScan]);

  // Interpolação para mover a linha no eixo Y
  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height],
  });

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderColor: color,
          backgroundColor: bgColor || "#0a0f1a",
          borderRadius: borderRadius || 4,
        },
      ]}
    >
      {/* Emoji centralizado */}
      <Text style={{ fontSize: Math.round((width + height) / 3.5), zIndex: 1 }}>
        {emoji}
      </Text>

      {/* Linha do Scanner Animada */}
      {!hideScan && (
        <Animated.View
          style={[
            styles.scanLineWrapper,
            { transform: [{ translateY }] }
          ]}
        >
          <LinearGradient
            colors={['transparent', retroGreen, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.line}
          />
        </Animated.View>
      )}

      {/* Efeito de Overlay CRT (Simples e eficiente no mobile) */}
      <View style={styles.crtOverlay} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  scanLineWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  line: {
    height: 1.5, // Linha fina estilo PC antigo
    width: "100%",
  },
  crtOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 242, 255, 0.03)", // Leve tom azulado tech
    zIndex: 3,
  },
});