import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

interface ImpostorBackgroundProps {
  scanner?: boolean; // Propriedade opcional para ligar/desligar o scanner
}

// ==========================================
// ✨ PARALLAX DE ESTRELAS INFINITO
// ==========================================
const StarLayer = ({ count, size, speed, opacity }: any) => {
  const translateX = useSharedValue(0);

  const stars = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      top: Math.random() * height,
      left: Math.random() * width,
      opacity: Math.random() * opacity + 0.1
    }));
  }, [count, opacity]);

  useEffect(() => {
    translateX.value = withRepeat(withTiming(-width, { duration: speed, easing: Easing.linear }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));

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
// 📡 SCANNER DE RADAR TÁTICO
// ==========================================
const Scanline = () => {
  const translateY = useSharedValue(-100);

  useEffect(() => {
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
// 🌌 COMPONENTE PRINCIPAL (ATUALIZADO)
// ==========================================
export const ImpostorBackground = ({ scanner = true }: ImpostorBackgroundProps) => {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* 1. O Vazio Espacial */}
      <LinearGradient colors={["#020617", "#000000", "#020617"]} style={StyleSheet.absoluteFillObject} />

      {/* 2. Parallax */}
      <StarLayer count={60} size={1.5} speed={45000} opacity={0.3} />
      <StarLayer count={30} size={2.5} speed={30000} opacity={0.5} />
      <StarLayer count={15} size={3.5} speed={15000} opacity={0.8} />

      {/* 3. Sobreposição Tática Condicional 🔥 */}
      {scanner && <Scanline />}

      {/* 4. Vinheta Escura */}
      <View style={styles.vignette} />
    </View>
  );
};

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
    flexDirection: "row",
    width: width * 2,
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
    height: 60,
    zIndex: 10
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 60,
    borderColor: "rgba(0,0,0,0.4)",
    borderRadius: 20
  }
});
