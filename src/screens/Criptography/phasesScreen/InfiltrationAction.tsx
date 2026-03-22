import React, { useEffect, useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
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
          <CustomText variant="hint" style={{ color: COLORS.textSecondary }}>
            {currentTeam.players.length} {t("games.cryptography_action_players")}
          </CustomText>
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
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { alignItems: "center" }]}>
            <CustomText variant="label" style={styles.statTitle}>
              {t("games.cryptography_action_skips")}
            </CustomText>
            <View style={styles.skipsIcons}>
              {Array.from({ length: 3 }).map((_, i) => (
                <MaterialCommunityIcons
                  key={i}
                  name={i < gameState.skipsLeft ? "skip-next" : "skip-next-outline"}
                  size={24}
                  color={i < gameState.skipsLeft ? COLORS.amber : "rgba(255,255,255,0.1)"}
                />
              ))}
            </View>
          </View>
          <View style={styles.statBox}>
            <CustomText variant="label" style={styles.statTitle}>
              {t("games.cryptography_action_hits")}
            </CustomText>
            <CustomText variant="h1" style={{ color: COLORS.success }}>
              {currentTeam.roundScore}
            </CustomText>
          </View>
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

  footer: { gap: 15 },
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
