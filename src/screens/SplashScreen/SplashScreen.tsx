import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, StatusBar, Dimensions } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";

const { width } = Dimensions.get("window");

type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export const SplashScreen = ({ navigation }: Props) => {
  // Animações
  const expandDev = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // 1. Animação Suave do Desenvolvedor (Expansão e Opacidade)
    Animated.timing(expandDev, {
      toValue: 1,
      duration: 2000,
      delay: 500,
      useNativeDriver: false
    }).start();

    // 2. Loop Infinito dos Pontinhos de Carregamento
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true })
        ])
      );
    };

    Animated.parallel([animateDot(dot1, 0), animateDot(dot2, 200), animateDot(dot3, 400)]).start();

    // 3. Timer para Home
    const timer = setTimeout(() => {
      navigation.replace("Home");
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigation]);

  // Interpolações para o desenvolvedor
  const maxWidthDev = expandDev.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.45]
  });

  const opacityDev = expandDev.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4]
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* --- LOGO CENTRAL (ESTÁTICO) --- */}
      <View style={styles.hudWrapper}>
        <View style={styles.bracketLeft} />
        <CustomText style={styles.hudText}>
          PLAY
          <CustomText style={{ color: COLORS.textSecondary, fontSize: 25 }}>HOME</CustomText>
        </CustomText>
        <View style={styles.bracketRight} />
      </View>

      {/* --- RODAPÉ (DOTS + DEV) --- */}
      <View style={styles.footer}>
        {/* PONTINHOS DE CARREGAMENTO */}
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>

        {/* NOME DA DESENVOLVEDORA */}
        <View style={styles.devContainer}>
          <CustomText style={styles.devInitial}>U</CustomText>
          <Animated.View style={{ maxWidth: maxWidthDev, opacity: opacityDev }}>
            <CustomText numberOfLines={1} style={styles.devFullName}>
              super{" "}
            </CustomText>
          </Animated.View>

          <CustomText style={styles.devInitial}>I</CustomText>
          <Animated.View style={{ maxWidth: maxWidthDev, opacity: opacityDev }}>
            <CustomText numberOfLines={1} style={styles.devFullName}>
              nteractive
            </CustomText>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center"
  },
  hudWrapper: {
    flexDirection: "row",
    alignItems: "center"
  },
  hudText: {
    fontSize: 25,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 1,
    marginHorizontal: 15
  },
  bracketLeft: {
    width: 8,
    height: 30,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "rgba(255,255,255,0.15)"
  },
  bracketRight: {
    width: 8,
    height: 30,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "rgba(255,255,255,0.15)"
  },
  footer: {
    position: "absolute",
    bottom: 60,
    alignItems: "center"
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 15
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textSecondary || "#00F2FF"
  },
  devContainer: {
    flexDirection: "row",
    alignItems: "baseline"
  },
  devInitial: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "bold",
    letterSpacing: 1
  },
  devFullName: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: "300",
    letterSpacing: 0.5
  }
});
