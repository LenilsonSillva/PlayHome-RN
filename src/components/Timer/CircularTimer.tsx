import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, { useAnimatedProps, useSharedValue, withTiming, interpolateColor } from "react-native-reanimated";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { useAudio } from "@/contexts/audioContext";

// Criamos uma versão animada do Círculo do SVG
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  timeLeft: number;
  totalTime?: number;
}

export const CircularTimer = ({ timeLeft, totalTime = 60 }: Props) => {
  const { playSound } = useAudio();
  const radius = 34;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;

  // Valor animado para o progresso (de 1 a 0)
  const progress = useSharedValue(1);

  useEffect(() => {
    // Sincroniza o progresso com o tempo restante
    progress.value = withTiming(timeLeft / totalTime, { duration: 1000 });
    ((timeLeft > 0) && (timeLeft <= 5)) && playSound("alert");

  }, [timeLeft]);

  const animatedProps = useAnimatedProps(() => {
    return {
      // Dashoffset: quanto maior o valor, menor a linha visível
      strokeDashoffset: circumference * (1 - progress.value)
    };
  });

  // Cor dinâmica com transição suave entre Ciano e Vermelho
  const timerColor = timeLeft <= 10 ? COLORS.danger : COLORS.cyan;

  return (
    <View style={styles.container}>
      <Svg width="80" height="80" viewBox="0 0 80 80">
        {/* Círculo de Fundo (Trilho) */}
        <Circle cx="40" cy="40" r={radius} stroke="rgba(255, 255, 255, 0.1)" strokeWidth={strokeWidth} fill="none" />

        {/* Círculo de Progresso Animado */}
        <AnimatedCircle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={timerColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          // Gira o círculo para começar do topo (-90 graus)
          rotation="-90"
          origin="40, 40"
        />
      </Svg>

      {/* Texto Centralizado */}
      <View style={styles.textContainer}>
        <CustomText variant="h3" style={[styles.timerText, { color: timerColor }]}>
          {timeLeft}s
        </CustomText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center"
  },
  textContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center"
  },
  timerText: {
    fontWeight: "900",
    // Efeito de brilho no texto (glow)
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10
  }
});
