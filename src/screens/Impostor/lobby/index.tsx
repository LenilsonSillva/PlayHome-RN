import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { Header } from "@/components/Header/Header";
import { SettingsModal } from "@/components/SettingsModal/SettingsModal";
import { LobbyOffline } from "./LobbyOffline";
import { LobbyOnline } from "./LobbyOnline";
import { ImpostorBackground } from "@/components/Background/Background";

export default function ImpostorLobby() {
  const [mode, setMode] = useState<"local" | "online">("local");
  const [openModal, setOpenModal] = useState<boolean>(false);

  const LobbyTitle = (
    <View style={styles.titleContainer}>
      <CustomText variant="label" style={{ color: COLORS.danger }}>
        PROTOCOLO
      </CustomText>
      <CustomText variant="h3">IMPOSTOR</CustomText>
    </View>
  );

  return (
    <View style={styles.container}>
      <ImpostorBackground />
      <Header
        centerElement={LobbyTitle}
        onOpenSettings={() => {
          setOpenModal(true);
        }}
      />
      <SettingsModal visible={openModal} onClose={() => setOpenModal(false)} showResetWords={true} />

      {/* SELETOR DE MODO (Segmented Control) */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, mode === "local" && styles.activeTab]} onPress={() => setMode("local")}>
          <CustomText style={[styles.tabText, mode === "local" && styles.activeTabText]}>LOCAL 🏠</CustomText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, mode === "online" && styles.activeTab]} onPress={() => setMode("online")}>
          <CustomText style={[styles.tabText, mode === "online" && styles.activeTabText]}>ONLINE 🌏</CustomText>
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO DINÂMICO */}
      {mode === "local" ? <LobbyOffline /> : <LobbyOnline />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  titleContainer: { alignItems: "center" },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)"
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 8 },
  activeTab: { backgroundColor: COLORS.danger },
  tabText: { fontSize: 14, fontWeight: "bold", color: COLORS.textSecondary },
  activeTabText: { color: "#FFF" }
});
