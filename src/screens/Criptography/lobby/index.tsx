import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { LobbyOffline } from "./LobbyOffline";
import { Header } from "@/components/Header/Header";
import { SettingsModal } from "@/components/SettingsModal/SettingsModal";
import { useTranslation } from "react-i18next";
import { ImpostorBackground } from "@/components/Background/Background";
// import { LobbyOnline } from "./LobbyOnline"; // 🔥 Descomente no futuro!

export function CryptographyLobby() {
  const { t } = useTranslation();
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [openModal, setOpenModal] = useState<boolean>(false);

  const LobbyTitle = (
    <View style={styles.titleContainer}>
      <CustomText variant="label" style={{ color: COLORS.cyan }}>
        {t("home.header_protocol")}
      </CustomText>
      <CustomText variant="h3">{t("games.cryptography_title")}</CustomText>
    </View>
  );

  return (
    <View style={styles.safeArea}>
      <ImpostorBackground />
      <View style={styles.container}>
        <Header
          centerElement={LobbyTitle}
          onOpenSettings={() => {
            setOpenModal(true);
          }}
        />
        <SettingsModal visible={openModal} onClose={() => setOpenModal(false)} showResetWords={true} />

        {/* HEADER: Toggle Principal Offline / Online */}
        <View style={styles.toggleWrapper}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segBtn, !isOnlineMode && styles.activeSeg]}
              onPress={() => setIsOnlineMode(false)}
              activeOpacity={0.8}
            >
              <CustomText style={[styles.segText, !isOnlineMode && styles.activeText]}>
                {t("games.impostor_lobby_local")}
              </CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segBtn, isOnlineMode && styles.activeSeg]}
              onPress={() => setIsOnlineMode(true)}
              activeOpacity={0.8}
            >
              <CustomText style={[styles.segText, isOnlineMode && styles.activeText]}>
                {t("games.impostor_lobby_online")}
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>

        {/* CONTEÚDO: Renderiza a tela baseada na escolha */}
        <View style={styles.content}>
          {!isOnlineMode ? (
            <LobbyOffline />
          ) : (
            <View style={styles.onlinePlaceholder}>
              <CustomText variant="h2" style={{ color: COLORS.cyan }}>
                MODO REDE
              </CustomText>
              <CustomText variant="label" style={{ color: COLORS.textSecondary, marginTop: 10 }}>
                (Em desenvolvimento...)
              </CustomText>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  container: {
    flex: 1
  },
  titleContainer: { alignItems: "center" },
  toggleWrapper: {
    display: "none", // 🔥 MÁGICA AQUI: Esconde o botão e ajusta o layout!
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 4
  },
  segBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10
  },
  activeSeg: {
    backgroundColor: COLORS.cyan
  },
  segText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textSecondary
  },
  activeText: {
    color: COLORS.background
  },
  content: {
    flex: 1
  },
  onlinePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  }
});
