import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../styles/theme";

interface CardProps {
  children: React.ReactNode;
  accentColor: string;
}

export const Cards = ({ children, accentColor }: CardProps) => {
  const safeColor = accentColor || COLORS.cyan;
  return (
    <View style={styles.cardWrapper}>
      {/* Brilho Estático Externo */}
      <View
        style={[
          styles.glow,
          { shadowColor: safeColor, backgroundColor: safeColor }
        ]}
      />

      <View style={[styles.mainBody, { borderColor: `${safeColor}80` }]}>
        <LinearGradient
          colors={[`${safeColor}20`, "transparent"]}
          style={styles.gradient}
        >
          {children}
        </LinearGradient>

        {/* Detalhes de Canto Estilo Cyberpunk */}
        <View
          style={[
            styles.corner,
            {
              top: 10,
              left: 10,
              borderTopWidth: 2,
              borderLeftWidth: 2,
              borderColor: accentColor
            }
          ]}
        />
        <View
          style={[
            styles.corner,
            {
              bottom: 10,
              right: 10,
              borderBottomWidth: 2,
              borderRightWidth: 2,
              borderColor: accentColor
            }
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
    padding: 15, // Espaço para a sombra "respirar"
    alignItems: "center",
    justifyContent: "center"
  },
  glow: {
    position: "absolute",
    width: "95%",
    height: "95%",
    borderRadius: 30,
    opacity: 0.7,
    // iOS Shadow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    // Android Shadow
    elevation: 20
  },
  mainBody: {
    width: "100%",
    height: "100%",
    backgroundColor: "#050a18",
    borderRadius: 24,
    borderWidth: 2,
    overflow: "hidden"
  },
  gradient: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between"
  },
  corner: {
    position: "absolute",
    width: 15,
    height: 15
  }
});
