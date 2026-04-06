import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/styles/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAudio } from "@/contexts/audioContext";

interface HeaderProps {
  centerElement: React.ReactNode;
  onOpenSettings: () => void;
  position?: "absolute" | "relative";
  onGoBack?: () => void;
  hideBack?: boolean;
}

export const Header = ({
  centerElement,
  onOpenSettings,
  position = "relative",
  onGoBack,
  hideBack = false
}: HeaderProps) => {
  const navigation = useNavigation();
  const { playSound } = useAudio();
  const canGoBack = navigation.canGoBack() && !hideBack;

  // 🔥 3. Função que decide qual "voltar" usar
  const handleBackPress = () => {
    if (onGoBack) {
      onGoBack(); // Se você passou a função com o Modal, usa ela
    } else {
      navigation.goBack(); // Se não, faz o voltar padrão do app
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.background, "rgba(2, 6, 23, 0.8)", "transparent"]}
      locations={[0, 0.6, 1]}
      style={[styles.container, { position }]}
    >
      {/* ESQUERDA: Botão Voltar */}
      <View style={styles.side}>
        {canGoBack && (
          <TouchableOpacity
            onPress={() => {
              handleBackPress();
              playSound("click2");
            }} // 🔥 4. Usamos a nova função aqui
            style={styles.circleBtn}
          >
            <View style={styles.backArrow} />
          </TouchableOpacity>
        )}
      </View>

      {/* CENTRO */}
      <View style={styles.center}>{centerElement}</View>

      {/* DIREITA: Configurações */}
      <View style={styles.side}>
        <TouchableOpacity
          onPress={() => {
            onOpenSettings();
            playSound("click2");
          }}
          style={styles.circleBtn}
        >
          <Ionicons name="settings-outline" size={25} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

// ... Mantenha o StyleSheet igual ao original ...
const styles = StyleSheet.create({
  // ... (seus estilos atuais)
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    height: 120,
    width: "100%",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000
  },
  side: { width: 50, alignItems: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center"
  },
  backArrow: {
    width: 12,
    height: 12,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#FFF",
    transform: [{ rotate: "45deg" }],
    marginLeft: 4
  }
});
