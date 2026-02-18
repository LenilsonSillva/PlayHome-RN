import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal
} from "react-native";
import { COLORS, THEME } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { Cards } from "@/components/Cards/Cards";
import { ImpostorGame, ImpostorPlayer } from "@/games/impostor/types/game";
import { PlayerAvatar } from "@/games/common/components/PlayerAvatar";
import { useTranslation } from "react-i18next";

interface Props {
  data: ImpostorGame;
  onConfirmElimination: (player: ImpostorPlayer | null) => void;
}

export const EliminationPhase = ({ data, onConfirmElimination }: Props) => {
  const { t } = useTranslation();
  const [target, setTarget] = useState<ImpostorPlayer | null>(null);
  const alivePlayers = data.players.filter((p) => p.isAlive);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Espaço para evitar sobreposição com o header fixo */}
        <View style={styles.header}>
          <CustomText variant="label" style={styles.cyanText}>
            {t("games.impostor_elimination_aletTitle")}
          </CustomText>
          <CustomText variant="h1">
            {t("games.impostor_elimination_title1")}
            <CustomText variant="h1" style={{ color: COLORS.danger }}>
              {t("games.impostor_elimination_title2")}
            </CustomText>
          </CustomText>
        </View>

        <View style={styles.voteContent}>
          <CustomText variant="h3" style={styles.subtitle}>
            {t("games.impostor_elimination_subtitle")}
          </CustomText>
          <View style={styles.grid}>
            {alivePlayers.map((player) => (
              <TouchableOpacity
                key={player.id}
                style={styles.card}
                onPress={() => setTarget(player)}
              >
                <View
                  style={[
                    styles.cardContainer,
                    { borderTopColor: player.color, borderTopWidth: 2 }
                  ]}
                >
                  <View style={styles.cardContent}>
                    <PlayerAvatar
                      emoji={player.emoji}
                      color={player.color}
                      size={50}
                      borderRadius={25}
                    />
                    <CustomText variant="h3" numberOfLines={1}>
                      {player.name.toUpperCase()}
                    </CustomText>
                    <View style={styles.targetMark}>
                      <CustomText style={styles.targetText}>
                        [ {t("games.impostor_elimination_selectBtn")} ]
                      </CustomText>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => onConfirmElimination(null)}
        >
          <CustomText variant="label" style={styles.skipText}>
            {t("games.impostor_elimination_skipBtn")}
          </CustomText>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL DE CONFIRMAÇÃO */}
      <Modal visible={!!target} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Cards accentColor={COLORS.danger}>
              <View style={styles.modalInner}>
                <CustomText variant="label" style={{ color: COLORS.danger }}>
                  {t("games.impostor_elimination_alertEject")}
                </CustomText>
                <CustomText variant="h2" style={styles.modalTitle}>
                  {t("games.impostor_elimination_ejectConfirm")}
                </CustomText>

                <View style={styles.preview}>
                  <PlayerAvatar
                    emoji={target?.emoji || ""}
                    color={target?.color || ""}
                    size={80}
                  />
                  <CustomText variant="h1">{target?.name}</CustomText>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancel}
                    onPress={() => setTarget(null)}
                  >
                    <CustomText variant="label">
                      {t("games.impostor_elimination_back")}
                    </CustomText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirm}
                    onPress={() => {
                      onConfirmElimination(target);
                      setTarget(null);
                    }}
                  >
                    <CustomText
                      variant="label"
                      style={{ color: COLORS.background }}
                    >
                      {t("games.impostor_elimination_confirm")}
                    </CustomText>
                  </TouchableOpacity>
                </View>
              </View>
            </Cards>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    paddingInline: 15,
    paddingBottom: 40,
    minHeight: "100%",
    justifyContent: "space-between",
    paddingTop: 130
  },
  header: { alignItems: "center", marginTop: 20 },
  cyanText: { color: COLORS.cyan, letterSpacing: 3 },
  subtitle: {
    textAlign: "center",
    color: COLORS.textSecondary,
    marginBottom: 10
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 15
  },
  voteContent: {
    paddingTop: 30,
    gap: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  card: { width: "47%", height: 150 },
  cardContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "space-evenly"
  },
  cardContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%"
  },
  targetMark: {
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    width: "80%",
    alignItems: "center",
    paddingTop: 5
  },
  targetText: { fontSize: 10, color: COLORS.textSecondary, letterSpacing: 1 },
  skipBtn: {
    marginTop: 30,
    padding: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderRadius: 15,
    alignItems: "center"
  },
  skipText: { color: COLORS.textSecondary, fontSize: 12 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    padding: 20
  },
  modalBox: { height: 380 },
  modalInner: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center"
  },
  modalTitle: { textAlign: "center" },
  preview: { alignItems: "center", gap: 10 },
  modalActions: { flexDirection: "row", gap: 15 },
  cancel: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    alignItems: "center"
  },
  confirm: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    alignItems: "center"
  }
});
