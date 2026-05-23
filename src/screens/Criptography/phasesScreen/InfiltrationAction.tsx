import React, { useEffect, useState, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { CircularTimer } from "@/components/Timer/CircularTimer";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { CryptoGameState } from "@/games/cryptography/types/game";
import { CryptoCard } from "./components/CryptoCard";
import { useTranslation } from "react-i18next";

interface Props {
  gameState: CryptoGameState;
  onAction: (type: "correct" | "skip") => void;
  onTimeUp: () => void;
  onStartTimer: () => void;
}

export const InfiltrationAction = ({ gameState, onAction, onTimeUp, onStartTimer }: Props) => {
  const { t } = useTranslation();
  const currentTeam = gameState.teams[gameState.currentTeamIndex];

  const operator = useMemo(() => {
    return currentTeam.players.find((p) => p.id === currentTeam.operatorId);
  }, [currentTeam]);

  // ==========================================
  // ⏱️ TIMER BLINDADO
  // ==========================================
  const [timeLeft, setTimeLeft] = useState(gameState.config.roundTime);
  const isTimerRunning = !!gameState.roundEndTime;
  const isRoundActive = isTimerRunning && timeLeft > 0;

  useEffect(() => {
    if (!gameState.roundEndTime) {
      setTimeLeft(gameState.config.roundTime);
    }
  }, [gameState.roundEndTime, gameState.config.roundTime]);

  useEffect(() => {
    if (!gameState.roundEndTime) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((gameState.roundEndTime! - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onTimeUp();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [gameState.roundEndTime, onTimeUp]);

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Altura para a StatusBar transparente*/}
      <View style={{ height: 120 }} />

      {/* 1. CABEÇALHO HUD */}
      <View style={[styles.header, { borderColor: currentTeam.color }]}>
        <View style={styles.headerLeft}>
          <CustomText variant="label" style={{ color: COLORS.white, fontSize: 10, letterSpacing: 1 }}>
            {t("games.cryptography_action_playingNow")}
          </CustomText>
          <CustomText variant="h2" style={{ color: currentTeam.color, textTransform: "uppercase", marginVertical: 2 }}>
            <CustomText variant="h2">{t("games.cryptography_action_team")}</CustomText> {currentTeam.name}
          </CustomText>
          <View style={styles.statsCompact}>
            <View style={styles.statCompactItem}>
              <CustomText variant="hint" style={{ color: COLORS.success }}>
                {t("games.cryptography_action_hits")}:
              </CustomText>
              <CustomText variant="label" style={{ color: COLORS.success, marginLeft: 4 }}>
                {currentTeam.roundScore}
              </CustomText>
            </View>
            <View style={styles.statCompactItem}>
              <CustomText variant="hint" style={{ color: COLORS.amber }}>
                {t("games.cryptography_action_skips")}:
              </CustomText>
              <CustomText variant="label" style={{ color: COLORS.amber, marginLeft: 4 }}>
                {gameState.skipsLeft}
              </CustomText>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <CircularTimer timeLeft={timeLeft} totalTime={gameState.config.roundTime} />
        </View>
      </View>

      {/* 2. O CARD (Importado, reaproveitável) */}
      <CryptoCard
        mode="infiltration"
        word={gameState.currentWord}
        operator={operator}
        teamColor={currentTeam.color}
        isTimerRunning={isTimerRunning}
        isRoundActive={isRoundActive}
        skipsLeft={gameState.skipsLeft}
        onAction={onAction}
        onStartTimer={onStartTimer}
      />

      {/* 3. ESTATÍSTICAS */}
      <View style={styles.footer}>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: gameState.skipsLeft === 0 || !isRoundActive ? "rgba(0,0,0,0.2)" : COLORS.danger,
                borderWidth: gameState.skipsLeft === 0 || !isRoundActive ? 2 : 0,
                borderColor: gameState.skipsLeft === 0 || !isRoundActive ? COLORS.danger20 : ""
              }
            ]}
            onPress={() => onAction("skip")}
            activeOpacity={0.8}
            disabled={gameState.skipsLeft === 0 || !isRoundActive}
          >
            <MaterialCommunityIcons
              name="skip-next"
              size={20}
              color={gameState.skipsLeft === 0 || !isRoundActive ? COLORS.danger20 : COLORS.background}
            />
            <CustomText
              variant="label"
              style={{ color: gameState.skipsLeft === 0 || !isRoundActive ? COLORS.danger20 : COLORS.background, marginLeft: 6 }}
            >
              {t("games.cryptography_card_skip")}
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: !isRoundActive ? "rgba(0,0,0,0.2)" : COLORS.success,
                borderWidth: !isRoundActive ? 2 : 0,
                borderColor: COLORS.success + "30"
              }
            ]}
            onPress={() => onAction("correct")}
            activeOpacity={0.8}
            disabled={!isRoundActive}
          >
            <MaterialCommunityIcons
              name="check-bold"
              size={20}
              color={!isRoundActive ? COLORS.success + "30" : COLORS.background}
            />
            <CustomText
              variant="label"
              style={{ color: !isRoundActive ? COLORS.success + "30" : COLORS.background, marginLeft: 6 }}
            >
              {t("games.cryptography_card_correct")}
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingBottom: 40, justifyContent: "space-between" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingInline: 20,
    paddingBlock: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderLeftWidth: 4
  },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: "flex-end", justifyContent: "center" },

  statsCompact: { flexDirection: "row", gap: 5, marginTop: 8 },
  statCompactItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 12
  },

  footer: { gap: 15 },
  actionButtonsRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingInline: 20,
    paddingBlock: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  statBox: { alignItems: "center" },
  statTitle: { color: COLORS.textSecondary, marginBottom: 5 },
  skipsIcons: { flexDirection: "row", gap: 6, marginTop: 5 }
});
