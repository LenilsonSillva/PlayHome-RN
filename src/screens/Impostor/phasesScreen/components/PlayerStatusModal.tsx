import React from "react";
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { ImpostorPlayer } from "@/games/impostor/types/game";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useTranslation } from "react-i18next";
import { useAudio } from "@/contexts/audioContext";
interface PlayerStatusModalProps {
  visible: boolean;
  onClose: () => void;
  players: ImpostorPlayer[];
  statusType: keyof ImpostorPlayer;
}

export const PlayerStatusModal = ({ visible, onClose, players, statusType }: PlayerStatusModalProps) => {
  const { t } = useTranslation();
  const { playSound } = useAudio();

  const textStatus = () => {
    switch (statusType) {
      case "ready":
        return t("games.impostor_statusModal_ready");
      case "voted":
        return t("games.impostor_statusModal_voted");

      default:
        break;
    }
  };

  return (
    <Modal
      transparent
      animationType="slide" // Slide combina melhor com listas
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <CustomText variant="h2" style={styles.title}>
              {t("games.impostor_statusModal_roomStatus")}
            </CustomText>
            <TouchableOpacity
              onPress={() => {
                onClose;
                playSound("click2");
              }}
              hitSlop={20}
            >
              <FontAwesome name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {players.map(
              (player, index) =>
                ((statusType === "voted" && player.isAlive) || statusType !== "voted") && (
                  <View key={player.socketId || index} style={styles.playerRow}>
                    <View style={styles.playerInfo}>
                      <CustomText variant="h3" style={styles.playerName}>
                        {player.name}
                      </CustomText>
                    </View>

                    <View style={[styles.badge, player[statusType] ? styles.badgeReady : styles.badgeWaiting]}>
                      {player[statusType] ? (
                        <FontAwesome name="check" size={14} color={COLORS.success} />
                      ) : (
                        <View style={styles.dotWaiting} />
                      )}
                      <CustomText
                        variant="label"
                        style={{
                          color: player[statusType] ? COLORS.success : COLORS.amber,
                          fontSize: 10
                        }}
                      >
                        {player[statusType] ? textStatus() : t("games.impostor_statusModal_waiting")}
                      </CustomText>
                    </View>
                  </View>
                )
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              onClose;
              playSound("click2");
            }}
          >
            <CustomText variant="label" style={{ color: COLORS.white }}>
              {t("home.back_btn")}
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    width: "100%",
    maxHeight: "70%",
    padding: 20,
    elevation: 20
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    paddingBottom: 15
  },
  title: { color: COLORS.white },
  list: { width: "100%" },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 10,
    borderRadius: 15,
    marginBottom: 10
  },
  playerInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  playerName: { color: COLORS.textPrimary },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1
  },
  badgeReady: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderColor: COLORS.success
  },
  badgeWaiting: {
    backgroundColor: COLORS.amber + "20",
    borderColor: COLORS.amber
  },
  dotWaiting: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.amber
  },
  closeBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    marginTop: 20,
    padding: 15,
    borderRadius: 15,
    alignItems: "center"
  }
});
