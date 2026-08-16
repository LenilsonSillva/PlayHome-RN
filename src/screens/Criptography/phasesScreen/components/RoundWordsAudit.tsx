import React from "react";
import { Modal, View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { useTranslation } from "react-i18next";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { CryptoGameState } from "@/games/cryptography/types/game";

interface Props {
  visible: boolean;
  onClose: () => void;
  gameState: CryptoGameState;
  onReassign: (wordIndex: number, newWinnerIndex: number | null) => void;
  showAlert: (title: string, message: string, icon?: string, buttons?: any[]) => void;
}

export const RoundWordsAuditModal = ({ visible, onClose, gameState, onReassign, showAlert }: Props) => {
  const { t } = useTranslation();

  const getTeamAdjustmentLimit = (team: any) => {
    const { config } = gameState;
    const wordsUsed = Math.max((team.roundScore || 0) + (team.roundErrors || 0), 0);

    if (config.mode === "infiltration") {
      if (wordsUsed <= 5) return 1;
      if (wordsUsed <= 10) return 2;
      return 3;
    }

    if (config.wordLimit <= 5) return 1;
    if (config.wordLimit <= 10) return 2;
    return 3;
  };

  const handleWordPress = (item: any, wordIndex: number) => {
    const isInfiltrationLocked =
      gameState.config.mode === "infiltration" && item.ownerTeamIndex !== null && item.ownerTeamIndex !== undefined;

    if (isInfiltrationLocked) {
      const ownerTeam = gameState.teams[item.ownerTeamIndex];
      const ownerLimit = getTeamAdjustmentLimit(ownerTeam);

      if (item.winnerTeamIndex !== null && item.winnerTeamIndex !== item.ownerTeamIndex) {
        showAlert(
          t("alerts.error"),
          `${t("games.cryptography_audit_assign_title", "ATRIBUIR PONTO")}: ${ownerTeam.name.toUpperCase()} ${t(
            "games.cryptography_audit_assign_desc",
            "é a equipe responsável por essa palavra."
          )}`
        );
        return;
      }

      if (item.winnerTeamIndex !== null) {
        const used = ownerTeam.manualAdjustmentRemoveCount ?? 0;
        if (used >= ownerLimit) {
          showAlert(t("alerts.error"), t("games.cryptography_audit_limit_reached", { team: ownerTeam.name }));
          return;
        }

        showAlert(
          t("games.cryptography_audit_remove_title", "REMOVER PONTO"),
          t("games.cryptography_audit_remove_desc", { team: ownerTeam.name }),
          "alert-circle-outline",
          [
            { text: t("alerts.cancel"), style: "cancel" },
            { text: t("alerts.confirm"), style: "destructive", onPress: () => onReassign(wordIndex, null) }
          ]
        );
        return;
      }

      const addUsed = ownerTeam.manualAdjustmentAddCount ?? 0;
      if (addUsed >= ownerLimit) {
        showAlert(t("alerts.error"), t("games.cryptography_audit_limit_reached", { team: ownerTeam.name }));
        return;
      }

      showAlert(
        t("games.cryptography_audit_assign_title", "ATRIBUIR PONTO"),
        `${ownerTeam.name.toUpperCase()} ${t("games.cryptography_audit_assign_desc", "foi a equipe que usou esta palavra.")}`,
        "plus-circle-outline",
        [
          { text: t("alerts.cancel"), style: "cancel" },
          { text: t("alerts.confirm"), onPress: () => onReassign(wordIndex, item.ownerTeamIndex) }
        ]
      );
      return;
    }

    if (item.winnerTeamIndex !== null) {
      const team = gameState.teams[item.winnerTeamIndex];
      const limit = getTeamAdjustmentLimit(team);
      const used = team.manualAdjustmentRemoveCount ?? 0;

      if (used >= limit) {
        showAlert(t("alerts.error"), t("games.cryptography_audit_limit_reached", { team: team.name }));
        return;
      }

      showAlert(
        t("games.cryptography_audit_remove_title", "REMOVER PONTO"),
        t("games.cryptography_audit_remove_desc", { team: team.name }),
        "alert-circle-outline",
        [
          { text: t("alerts.cancel"), style: "cancel" },
          { text: t("alerts.confirm"), style: "destructive", onPress: () => onReassign(wordIndex, null) }
        ]
      );
    } else {
      const teamOptions = gameState.teams.map((team, tIdx) => {
        const limit = getTeamAdjustmentLimit(team);
        const addUsed = team.manualAdjustmentAddCount ?? 0;

        return {
          text: `${team.name.toUpperCase()} (A ${addUsed}/${limit})`,
          onPress: () => {
            if (addUsed >= limit) {
              showAlert(t("alerts.error"), t("games.cryptography_audit_limit_reached", { team: team.name }));
            } else {
              onReassign(wordIndex, tIdx);
            }
          }
        };
      });

      showAlert(
        t("games.cryptography_audit_assign_title", "ATRIBUIR PONTO"),
        t("games.cryptography_audit_assign_desc", "Qual equipe realmente acertou esta palavra?"),
        "plus-circle-outline",
        [...teamOptions, { text: t("alerts.cancel"), style: "cancel" }]
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <CustomText variant="h2" style={styles.title}>
                {t("games.cryptography_audit_main_title", "AUDITORIA")}
              </CustomText>
              <CustomText variant="label" style={styles.subtitle}>
                {t("games.cryptography_audit_sub_title", "EDITE O RESULTADO")}
              </CustomText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.editTitle}>
            <CustomText variant="hint" style={styles.subtitle}>
              {t("games.cryptography_audit_assign_editTitle", "Clique para reatribuir pontos")}
            </CustomText>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {gameState.roundHistory.length === 0 ? (
              <CustomText style={styles.emptyText}>
                {t("games.cryptography_audit_empty", "Nenhuma palavra registrada.")}
              </CustomText>
            ) : (
              gameState.roundHistory.map((item, index) => {
                const winnerTeam = item.winnerTeamIndex !== null ? gameState.teams[item.winnerTeamIndex] : null;
                const ownerTeam =
                  item.ownerTeamIndex !== null && item.ownerTeamIndex !== undefined ? gameState.teams[item.ownerTeamIndex] : null;
                const isInfiltrationLock =
                  gameState.config.mode === "infiltration" &&
                  ownerTeam &&
                  ownerTeam !== null &&
                  item.ownerTeamIndex !== undefined;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.wordRow,
                      winnerTeam
                        ? { borderColor: winnerTeam.color + "60", backgroundColor: winnerTeam.color + "15" }
                        : styles.rowGray,
                      isInfiltrationLock && { borderStyle: "dashed" }
                    ]}
                    onPress={() => handleWordPress(item, index)}
                  >
                    <View style={styles.wordInfo}>
                      <MaterialCommunityIcons
                        name={winnerTeam ? "check-decagram" : "minus-circle-outline"}
                        size={20}
                        color={winnerTeam ? winnerTeam.color : "#666"}
                      />
                      <View style={styles.wordMeta}>
                        <CustomText style={[styles.wordText, winnerTeam ? { color: "#FFF" } : { color: "#888" }]}>
                          {item.word}
                        </CustomText>
                        {ownerTeam && (
                          <CustomText style={styles.ownerLabel}>
                            {isInfiltrationLock
                              ? `USADA POR ${ownerTeam.name.toUpperCase()}`
                              : `RESPONSÁVEL: ${ownerTeam.name.toUpperCase()}`}
                          </CustomText>
                        )}
                      </View>
                    </View>

                    {winnerTeam && (
                      <View style={[styles.teamTag, { backgroundColor: winnerTeam.color }]}>
                        <CustomText style={styles.teamTagText}>{winnerTeam.name.split(" ")[0]}</CustomText>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <TouchableOpacity style={styles.footerBtn} onPress={onClose}>
            <CustomText variant="h3" style={styles.footerBtnText}>
              {t("alerts.confirm")}
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" },
  container: {
    width: "90%",
    height: "80%",
    backgroundColor: "#111",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#222",
    overflow: "hidden"
  },
  header: {
    padding: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#222"
  },
  title: { color: COLORS.cyan },
  subtitle: { color: COLORS.textSecondary, fontSize: 10, letterSpacing: 2 },
  editTitle: { display: "flex", alignItems: "center", justifyContent: "center", marginTop: 20 },
  closeBtn: { padding: 5 },
  list: { padding: 20 },
  wordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1
  },
  rowGray: { borderColor: "#222", backgroundColor: "#1a1a1a" },
  wordInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  wordMeta: {},
  wordText: { fontSize: 18, fontWeight: "bold", textTransform: "uppercase" },
  ownerLabel: { color: COLORS.textSecondary, fontSize: 9, opacity: 0.8, letterSpacing: 1, textTransform: "uppercase" },
  teamTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  teamTagText: { color: "#000", fontSize: 10, fontWeight: "900" },
  emptyText: { textAlign: "center", color: "#666", marginTop: 40 },
  footerBtn: { backgroundColor: COLORS.cyan, padding: 20, alignItems: "center" },
  footerBtnText: { color: "#000" }
});
