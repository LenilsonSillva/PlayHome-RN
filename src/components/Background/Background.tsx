import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  withDelay
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

// ==========================================
// ✨ PARALLAX DE ESTRELAS INFINITO (MANTIDO)
// ==========================================
const StarLayer = ({ count, size, speed, opacity }: any) => {
  const translateX = useSharedValue(0);

  // Gera as estrelas uma única vez e espalha pela tela
  const stars = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      top: Math.random() * height,
      left: Math.random() * width,
      opacity: Math.random() * opacity + 0.1 // Opacidade variada por estrela
    }));
  }, [count, opacity]);

  useEffect(() => {
    // Move a camada inteira para a esquerda e reseta perfeitamente (Loop infinito)
    translateX.value = withRepeat(withTiming(-width, { duration: speed, easing: Easing.linear }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));

  // Renderiza as estrelas. Copiamos 2x para o loop ser perfeito e não deixar buracos
  const renderStars = () => (
    <View style={{ width, height }}>
      {stars.map((s) => (
        <View key={s.id} style={[styles.star, { top: s.top, left: s.left, width: size, height: size, opacity: s.opacity }]} />
      ))}
    </View>
  );

  return (
    <Animated.View style={[styles.starLayer, animatedStyle]}>
      {renderStars()}
      {renderStars()}
    </Animated.View>
  );
};

// ==========================================
// 📡 SCANNER DE RADAR TÁTICO (AJUSTADO)
// ==========================================
const Scanline = () => {
  const translateY = useSharedValue(-100);

  useEffect(() => {
    // 🔥 O Truque do Delay: O scanner viaja muito além da tela (height * 3).
    // Ele cruza a tela em ~2 segundos e passa os próximos ~6 segundos escondido lá embaixo
    // antes de o loop reiniciar do topo!
    translateY.value = withRepeat(withTiming(height * 3, { duration: 15000, easing: Easing.linear }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <Animated.View style={[styles.scanlineWrapper, animatedStyle]}>
      <LinearGradient
        colors={["transparent", "rgba(0, 242, 255, 0.02)", "rgba(0, 242, 255, 0.25)", "transparent"]}
        locations={[0, 0.6, 0.95, 1]}
        style={StyleSheet.absoluteFillObject}
      />
    </Animated.View>
  );
};

// ==========================================
// 🌌 COMPONENTE PRINCIPAL
// ==========================================
export const ImpostorBackground = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* 1. O Vazio Espacial */}
      <LinearGradient colors={["#020617", "#000000", "#020617"]} style={StyleSheet.absoluteFillObject} />

      {/* 2. Parallax (Sensação de profundidade 3D da nave voando) */}
      {/* Estrelas Fundo (Muitas, lentas e pequenas) */}
      <StarLayer count={60} size={1.5} speed={45000} opacity={0.3} />
      {/* Estrelas Meio (Velocidade média) */}
      <StarLayer count={30} size={2.5} speed={30000} opacity={0.5} />
      {/* Estrelas Frente (Poucas, grandes e muito rápidas) */}
      <StarLayer count={15} size={3.5} speed={15000} opacity={0.8} />

      {/* 3. Sobreposição Tática (O Scanline mais fino e com delay) */}
      <Scanline />

      {/* 4. Vinheta Escura nas bordas para focar a visão no centro */}
      <View style={styles.vignette} />
    </View>
  );
};

// ==========================================
// 🎨 ESTILOS
// ==========================================
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    overflow: "hidden"
  },
  starLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    flexDirection: "row", // Coloca as duas cópias lado a lado
    width: width * 2, // Dobro da tela para o loop caber
    height: height
  },
  star: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 50
  },
  scanlineWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: 60, // 🔥 Tamanho bem menor e mais sutil como você pediu
    zIndex: 10
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 60,
    borderColor: "rgba(0,0,0,0.4)", // Escurece as bordas da tela sutilmente
    borderRadius: 20
  }
});
