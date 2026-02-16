import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { ImpostorGame, ImpostorPlayer } from "@/games/impostor/types/game";
import { PlayerAvatar } from "@/games/common/components/PlayerAvatar";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import FontAwesome from "@expo/vector-icons/FontAwesome";

interface DiscussPhaseProps {
  data: ImpostorGame;
  onNextVotingBtn: () => void;
  onNextEliminationBtn: () => void;
  reviewEnabled: boolean; // Permite revisar palavras durante a discussão
  onPlayerPress: (player: ImpostorPlayer) => void; // Função para lidar com clique no jogador
  playerHasSeenWord: string[]; // Lista de IDs dos jogadores que já viram suas palavras
}

export const DiscussPhase = ({
  data,
  onNextVotingBtn,
  onNextEliminationBtn,
  reviewEnabled,
  onPlayerPress,
  playerHasSeenWord
}: DiscussPhaseProps) => {
  const { t } = useTranslation();
  const [elapsedTime, setElapsedTime] = useState(0);

  // Cronômetro da discussão
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const impostorsAlive = data.players.filter(
    (p) => p.isAlive && p.isImpostor
  ).length;
  const startingPlayer = data.players.find((p) => p.name === data.whoStart);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 3 e 5. STATUS DO SISTEMA (Tempo e Impostores) */}
        <View style={styles.statusRow}>
          <View style={styles.statusCard}>
            <CustomText variant="label" style={styles.statusLabel}>
              {t("games.impostor_discuss_time")}
            </CustomText>
            <CustomText variant="h2" style={styles.statusValue}>
              {formatTime(elapsedTime)}
            </CustomText>
          </View>

          <View
            style={[
              styles.statusCard,
              { borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.1)" }
            ]}
          >
            <CustomText
              variant="label"
              style={[styles.statusLabel, { color: COLORS.danger }]}
            >
              {t("games.impostor_discuss_impostorsLeft")}
            </CustomText>
            <CustomText
              variant="h2"
              style={[styles.statusValue, { color: COLORS.danger }]}
            >
              {impostorsAlive}{" "}
              {impostorsAlive === 1
                ? t("games.impostor_discuss_impostor")
                : t("games.impostor_discuss_impostors")}
            </CustomText>
          </View>
        </View>

        {/* 4. QUEM INICIA A PARTIDA */}
        {data.players
          .filter((p) => p.isAlive)
          .find((p) => p.name === data.whoStart)?.name && (
          <View style={styles.starterSection}>
            <LinearGradient
              colors={["rgba(0, 242, 255, 0.1)", "transparent"]}
              style={styles.starterCard}
            >
              <View style={styles.starterTextContent}>
                <CustomText variant="label" style={{ color: COLORS.cyan }}>
                  {t("games.impostor_discuss_whoStart")}
                </CustomText>
                <CustomText variant="h2" style={styles.starterName}>
                  {data.whoStart}
                </CustomText>
              </View>
              <View style={styles.starterAvatarWrapper}>
                <PlayerAvatar
                  emoji={startingPlayer?.emoji || "👤"}
                  color={startingPlayer?.color || COLORS.cyan}
                  size={50}
                />
              </View>
            </LinearGradient>
          </View>
        )}

        <View style={{ alignItems: "center", marginBottom: 30 }}>
          <CustomText variant="body" style={styles.subtitle}>
            {t("games.impostor_discuss_subtitle")}
          </CustomText>
        </View>

        {/* 6. LISTA DE TRIPULANTES E SCORES ANTERIORES */}
        <View style={styles.crewSection}>
          <CustomText variant="label" style={styles.crewTitle}>
            {t("games.impostor_discuss_monitorTitle")}
          </CustomText>

          {data.players.map((player) => (
            <TouchableOpacity
              key={player.id}
              disabled={
                !reviewEnabled ||
                !player.isAlive ||
                playerHasSeenWord.includes(player.id)
              } // Desabilita se a revisão não estiver ativa, se o jogador estiver morto ou se já tiver visto a palavra
              onPress={() => onPlayerPress(player)}
              style={[styles.playerRow, !player.isAlive && styles.playerDead]}
            >
              <View style={styles.playerMainInfo}>
                <PlayerAvatar
                  emoji={player.emoji}
                  color={player.isAlive ? player.color : COLORS.textSecondary}
                  size={35}
                  hideScan={true}
                />
                <View style={styles.nameBox}>
                  <CustomText variant="h3" style={styles.pName}>
                    {player.name}
                  </CustomText>
                  <CustomText variant="hint" style={styles.pStatus}>
                    {player.isAlive
                      ? t("games.impostor_discuss_isAlive")
                      : t("games.impostor_discuss_notAlive")}
                  </CustomText>
                </View>
              </View>

              <View style={{ marginRight: 15 }}>
                {reviewEnabled && player.isAlive ? (
                  playerHasSeenWord.includes(player.id) ? (
                    <FontAwesome
                      name="eye-slash"
                      size={20}
                      color={COLORS.textSecondary}
                    />
                  ) : (
                    <FontAwesome name="eye" size={20} color={COLORS.cyan} />
                  )
                ) : null}
              </View>

              <View style={styles.playerScoreBox}>
                <CustomText variant="label" style={styles.scoreLabel}>
                  {t("games.impostor_discuss_score")}
                </CustomText>
                <CustomText variant="h3" style={styles.scoreValue}>
                  {/* Mostra o score da rodada passada */}
                  {player.score}
                </CustomText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 7. BOTÕES DE AÇÃO */}
        <View style={styles.actionFooter}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onNextVotingBtn}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.danger, "#7f1d1d"]}
              style={styles.btnGradient}
            >
              <CustomText variant="h3" style={styles.btnText}>
                {t("games.impostor_discuss_startVote")}
              </CustomText>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onNextEliminationBtn}
          >
            <CustomText variant="label" style={styles.secondaryBtnText}>
              {t("games.impostor_discuss_eliminate")}
            </CustomText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40
  },
  headerSection: {
    marginBottom: 25
  },
  subtitle: {
    marginTop: 5,
    opacity: 0.6,
    textAlign: "center"
  },
  statusRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 25
  },
  statusCard: {
    flex: 1,
    padding: 15,
    alignItems: "center"
  },
  statusLabel: {
    fontSize: 9,
    marginBottom: 5
  },
  statusValue: {
    fontSize: 20,
    color: "#FFF"
  },
  starterSection: {
    marginBottom: 30
  },
  starterCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 242, 255, 0.2)"
  },
  starterTextContent: {
    flex: 1
  },
  starterName: {
    marginTop: 2,
    textTransform: "uppercase"
  },
  starterAvatarWrapper: {
    marginTop: -10 // Compensa o margin interno do PlayerAvatar
  },
  crewSection: {
    marginBottom: 30
  },
  crewTitle: {
    marginBottom: 15,
    opacity: 0.5
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  playerDead: {
    opacity: 0.3,
    borderStyle: "dashed"
  },
  playerMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  nameBox: {
    marginLeft: 15
  },
  pName: {
    fontSize: 18
  },
  pStatus: {
    fontSize: 9,
    letterSpacing: 1
  },
  playerScoreBox: {
    alignItems: "flex-end"
  },
  scoreLabel: {
    fontSize: 8,
    color: COLORS.textSecondary
  },
  scoreValue: {
    color: COLORS.cyan
  },
  actionFooter: {
    marginTop: 10,
    gap: 15
  },
  primaryBtn: {
    height: 70,
    borderRadius: 18,
    overflow: "hidden",
    elevation: 8,
    shadowColor: COLORS.danger,
    shadowRadius: 15,
    shadowOpacity: 0.4
  },
  btnGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  btnText: {
    color: "#FFF",
    letterSpacing: 2
  },
  secondaryBtn: {
    padding: 15,
    alignItems: "center"
  },
  secondaryBtnText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    textDecorationLine: "underline"
  }
});
