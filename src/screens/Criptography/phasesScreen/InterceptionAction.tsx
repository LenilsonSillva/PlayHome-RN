import React, { useEffect, useState, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { useTranslation } from "react-i18next";
import { CircularTimer } from "@/components/Timer/CircularTimer";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { CryptoGameState } from "@/games/cryptography/types/game";
import { CryptoCard } from "./components/CryptoCard";

interface Props {
  gameState: CryptoGameState;
  onFinishMatch: (winnerTeamIdx: number | null) => void;
  onPassTurn: () => void;
  onStartTimer: () => void;
}

export const InterceptionAction = ({ gameState, onFinishMatch, onPassTurn, onStartTimer }: Props) => {
  const { t } = useTranslation();
  const currentTeam = gameState.teams[gameState.currentTeamIndex];

  const operator = useMemo(() => {
    return currentTeam.players.find((p) => p.id === currentTeam.operatorId);
  }, [currentTeam]);

  // ==========================================
  // ⏱️ TIMER DO DUELO
  // ==========================================
  const [timeLeft, setTimeLeft] = useState(gameState.config.roundTime);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [turnEndTime, setTurnEndTime] = useState<number | null>(null);

  // Reseta o timer toda vez que a palavra ou o time mudar
  useEffect(() => {
    setIsTimerRunning(false);
    setTurnEndTime(null);
    setTimeLeft(gameState.config.roundTime);
  }, [gameState.currentWord, gameState.currentTeamIndex, gameState.config.roundTime]);

  const startTurnTimer = () => {
    setIsTimerRunning(true);
    setTurnEndTime(Date.now() + gameState.config.roundTime * 1000);
    onStartTimer();
  };

  // Loop do Cronômetro
  useEffect(() => {
    if (!isTimerRunning || !turnEndTime) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((turnEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onPassTurn(); // Tempo acabou = Errou/Passou a vez automaticamente
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isTimerRunning, turnEndTime, onPassTurn]);

  // ==========================================
  // 🏆 AÇÕES (Interligadas com a Carta)
  // ==========================================
  const handleAction = (type: "correct" | "skip") => {
    if (type === "correct") {
      onFinishMatch(gameState.currentTeamIndex); // Acertou, ganha o ponto
    } else {
      onPassTurn(); // Errou, passa a vez
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Altura para a StatusBar transparente*/}
      <View style={{ height: 115 }} />

      {/* 1. PROGRESSO DA PARTIDA NO TOPO */}
      <View style={styles.matchProgress}>
        <CustomText variant="label" style={styles.progressText}>
          PALAVRA {gameState.currentMatchIndex + 1} DE {gameState.config.wordLimit}
        </CustomText>
        <View style={styles.progressBarBg}>
          <View
            style={[styles.progressBarFill, { width: `${(gameState.currentMatchIndex / gameState.config.wordLimit) * 100}%` }]}
          />
        </View>
      </View>

      {/* 2. CABEÇALHO HUD */}
      <View style={[styles.header, { borderColor: currentTeam.color, borderLeftColor: currentTeam.color }]}>
        <View style={styles.headerLeft}>
          <CustomText variant="label" style={{ color: COLORS.white, fontSize: 10, letterSpacing: 1 }}>
            Vez da
          </CustomText>
          <CustomText variant="h2" style={{ color: currentTeam.color, textTransform: "uppercase", marginVertical: 2 }}>
            <CustomText variant="h2">EQUIPE </CustomText>
            {currentTeam.name}
          </CustomText>
          <CustomText variant="hint" style={{ color: COLORS.textSecondary }}>
            {currentTeam.players.length} jogadores
          </CustomText>
        </View>
        <View style={styles.headerRight}>
          <CircularTimer timeLeft={timeLeft} totalTime={gameState.config.roundTime} />
        </View>
      </View>

      {/* 3. ÁREA DO CARD (100% Modular) */}
      <View style={styles.cardArea}>
        <CryptoCard
          mode="interception"
          key={`${gameState.currentTeamIndex}-${gameState.currentWord}`}
          word={gameState.currentWord}
          operator={operator}
          teamColor={currentTeam.color}
          isTimerRunning={isTimerRunning}
          isRoundActive={isTimerRunning}
          skipsLeft={gameState.skipsLeft} // O Componente lida com o valor sem quebrar a lógica
          onAction={handleAction}
        />
      </View>

      {/* 4. RODAPÉ E BOTÕES DE AÇÃO */}
      <View style={styles.footer}>
        <View style={styles.queueIndicator}>
          {gameState.teams.map((t, idx) => (
            <View
              key={t.id}
              style={[
                styles.queueDot,
                { backgroundColor: t.color, opacity: idx === gameState.currentTeamIndex ? 1 : 0.3 },
                idx === gameState.currentTeamIndex && { transform: [{ scale: 1.5 }] }
              ]}
            />
          ))}
        </View>

        {!isTimerRunning ? (
          <View style={styles.setupActions}>
            <TouchableOpacity style={styles.startBtn} onPress={startTurnTimer} activeOpacity={0.8}>
              <MaterialCommunityIcons name="timer-play-outline" size={24} color={COLORS.background} />
              <CustomText variant="h3" style={{ color: COLORS.background, marginLeft: 10 }}>
                DICA DADA! INICIAR TEMPO
              </CustomText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { alignItems: "center" }]}>
              <CustomText variant="label" style={styles.statTitle}>
                TENTATIVAS
              </CustomText>
              <CustomText variant="h1" style={{ color: COLORS.amber }}>
                {currentTeam.roundErrors}
              </CustomText>
            </View>
            <View style={styles.statBox}>
              <CustomText variant="label" style={styles.statTitle}>
                ACERTOS
              </CustomText>
              <CustomText variant="h1" style={{ color: COLORS.success }}>
                {currentTeam.roundScore}
              </CustomText>
            </View>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingBottom: 40, justifyContent: "space-between" },

  matchProgress: { alignItems: "center", marginBottom: 15 },
  progressText: { color: COLORS.textSecondary, letterSpacing: 2, marginBottom: 5 },
  progressBarBg: { width: "60%", height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2 },
  progressBarFill: { height: "100%", backgroundColor: COLORS.cyan, borderRadius: 2 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingInline: 15,
    paddingBlock: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderLeftWidth: 4
  },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: "flex-end", justifyContent: "center" },

  cardArea: { flex: 1, justifyContent: "center", alignItems: "center" },

  footer: { gap: 5 },
  queueIndicator: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 10 },
  queueDot: { width: 8, height: 8, borderRadius: 4 },

  setupActions: { gap: 15 },
  startBtn: {
    backgroundColor: COLORS.cyan,
    flexDirection: "row",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingInline: 20,
    paddingBlock: 7,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  statBox: { alignItems: "center" },
  statTitle: { color: COLORS.textSecondary }
});
