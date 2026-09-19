import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { useTranslation } from "react-i18next";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { CircularTimer } from "@/components/Timer/CircularTimer";
import { ImpostorBackground } from "@/components/Background/Background";
import type { CryptoTeamView, CryptoView } from "@/games/cryptography/types/online";
import { serverTimeOffset } from "@/games/cryptography/utils/onlineViewMapper";

// ============================================================
// Telas de espera do modo online — quem NÃO controla o turno
// acompanha a partida por aqui (mesmo idioma visual do offline).
//
//   variant "yourGroup": membro do grupo da vez (infiltração) —
//                        o grupo adivinha, a palavra fica oculta
//   variant "waitTurn":  outros grupos / espectadores
//   variant "stayAlert": interceptação — "fique atento"
//
// A palavra mostrada é sempre a que o servidor autorizou
// (view.currentWord já vem null quando oculta).
// ============================================================

export type WaitingVariant = "yourGroup" | "waitTurn" | "stayAlert";

interface OnlineWaitingScreenProps {
  view: CryptoView;
  variant: WaitingVariant;
  /** stayAlert: solicitado pelos operadores enquanto o tempo está parado */
  onRequestWordChange?: () => void;
}

// ---------------- Contagem regressiva (servidor é a fonte) ----------------
// serverOffset compensa o skew de relógio (padrão Impostor online):
// `Date.now() + offset` ≈ relógio do servidor.
export function useServerCountdown(roundEndTime: number | null, total: number, serverOffset: number = 0): number | null {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!roundEndTime) {
      setLeft(null);
      return;
    }
    const end = roundEndTime;
    const compute = () => setLeft(Math.max(0, Math.ceil((end - (Date.now() + serverOffset)) / 1000)));
    compute();
    const id = setInterval(compute, 250);
    return () => clearInterval(id);
  }, [roundEndTime, serverOffset]);

  return left;
}

// ---------------- Caixa da palavra (visível ou trancada) ----------------
export function WordPeek({ view, hiddenText }: { view: CryptoView; hiddenText: string }) {
  const { t } = useTranslation();
  const word = view.currentWordVisible ? view.currentWord : null;
  const [revealed, setRevealed] = useState(false);

  return (
    <Pressable
      style={[styles.wordPeekBox, revealed && styles.wordPeekBoxRevealed]}
      disabled={!word}
      onPressIn={() => word && setRevealed(true)}
      onPressOut={() => setRevealed(false)}
      accessibilityRole="button"
      accessibilityLabel={word ? t("games.cryptography_action_holdToView") : hiddenText}
    >
      {word ? (
        revealed ? (
          <>
            <CustomText variant="hint" style={styles.wordPeekLabel}>
              {t("games.cryptography_online_game_currentWord")}
            </CustomText>
            <CustomText variant="h2" style={[styles.wordPeekValue, { color: COLORS.cyan }]}>
              {word}
            </CustomText>
          </>
        ) : (
          <View style={styles.wordPeekLocked}>
            <MaterialCommunityIcons name="fingerprint" size={26} color={COLORS.cyan} />
            <CustomText variant="label" style={styles.wordPeekHidden}>
              🔒 {t("games.cryptography_action_holdToView")}
            </CustomText>
          </View>
        )
      ) : (
        <CustomText variant="label" style={styles.wordPeekHidden}>
          🔒 {hiddenText}
        </CustomText>
      )}
    </Pressable>
  );
}

// ---------------- Integrantes do grupo (chips c/ conexão) ----------------
export function TeamChips({ team }: { team: CryptoTeamView }) {
  return (
    <View style={styles.chipsRow}>
      {team.players.map((p) => (
        <View key={p.id} style={styles.memberChip}>
          <CustomText style={styles.chipEmoji}>{p.emoji || "👤"}</CustomText>
          <CustomText variant="label" style={styles.chipName} numberOfLines={1}>
            {p.name}
          </CustomText>
          <View
            style={[
              styles.chipDot,
              {
                backgroundColor:
                  p.connection === "online" ? COLORS.success : p.connection === "present" ? COLORS.amber : COLORS.danger
              }
            ]}
          />
        </View>
      ))}
    </View>
  );
}

// ---------------- Placar compacto de todos os grupos ----------------
export function ScoreboardPanel({ teams }: { teams: CryptoTeamView[] }) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  return (
    <View style={styles.scoreboard}>
      {sorted.map((team, idx) => (
        <View key={team.id} style={styles.scoreRow}>
          <View style={[styles.scoreDot, { backgroundColor: team.color }]} />
          <CustomText variant="label" style={styles.scoreName} numberOfLines={1}>
            {idx + 1} {team.name}
          </CustomText>
          <CustomText variant="h3" style={styles.scoreValue}>
            {team.score}
          </CustomText>
        </View>
      ))}
    </View>
  );
}

// ============================================================
// TELA
// ============================================================
export const OnlineWaitingScreen = ({ view, variant, onRequestWordChange }: OnlineWaitingScreenProps) => {
  const { t } = useTranslation();
  const currentTeam = view.teams[view.currentTeamIndex];
  // memo por view: o offset só muda quando chega view nova do servidor
  const serverOffset = useMemo(() => serverTimeOffset(view.serverTime), [view.serverTime]);
  const timeLeft = useServerCountdown(view.roundEndTime, view.config.roundTime, serverOffset);

  const meta: Record<WaitingVariant, { icon: string; titleKey: string; isPlayingKey: string }> = {
    yourGroup: {
      icon: "🔍",
      titleKey: "games.cryptography_online_game_yourGroupPlaying",
      isPlayingKey: "games.cryptography_online_game_isPlaying"
    },
    waitTurn: {
      icon: "⏳",
      titleKey: "games.cryptography_online_game_waitingYourTurn",
      isPlayingKey: "games.cryptography_online_game_isPlaying"
    },
    stayAlert: {
      icon: "⚠️",
      titleKey: "games.cryptography_online_game_stayAlert",
      isPlayingKey: "games.cryptography_online_game_tryingIntercept"
    }
  };
  const m = meta[variant];

  const hiddenText =
    variant === "stayAlert"
      ? t("games.cryptography_online_game_onlyOperatorSees")
      : t("games.cryptography_online_game_hiddenWord");

  // Operadores podem solicitar a troca com o tempo parado (consenso)
  const canRequest =
    variant === "stayAlert" && view.roundEndTime == null && (view.controls.canRequestWordChange || view.controls.canReroll);

  return (
    <View style={styles.container}>
      <ImpostorBackground />

      <View style={styles.content}>
        {/* Altura para a StatusBar transparente */}
        <View style={{ height: 115 }} />

        <View style={[styles.panel, { borderColor: currentTeam.color }]}>
          <CustomText style={styles.panelIcon}>{m.icon}</CustomText>
          <CustomText variant="h2" style={styles.panelTitle}>
            {t(m.titleKey)}
          </CustomText>
          <CustomText variant="label" style={styles.panelSub} numberOfLines={3}>
            {t("games.cryptography_online_game_group", "Esquadrão")}{" "}
            <CustomText style={{ color: currentTeam.color, fontWeight: "900" }}>{currentTeam.name}</CustomText>{" "}
            {t(m.isPlayingKey)}
          </CustomText>

          {variant === "yourGroup" && (
            <CustomText variant="hint" style={styles.yourGroupHint}>
              {t("games.cryptography_online_game_yourGroupHint")}
            </CustomText>
          )}

          <WordPeek view={view} hiddenText={hiddenText} />

          <TeamChips team={currentTeam} />
        </View>

        {canRequest && onRequestWordChange ? (
          <TouchableOpacity style={styles.requestBtn} onPress={onRequestWordChange} activeOpacity={0.8}>
            <MaterialCommunityIcons name="refresh" size={20} color={COLORS.cyan} />
            <CustomText variant="label" style={{ color: COLORS.cyan, marginLeft: 10 }}>
              {t("games.cryptography_online_game_requestChange")}
            </CustomText>
          </TouchableOpacity>
        ) : (
          <View style={styles.timerRow}>
            <CircularTimer timeLeft={timeLeft != null ? timeLeft : view.config.roundTime} totalTime={view.config.roundTime} />
          </View>
        )}

        <ScoreboardPanel teams={view.teams} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, marginTop: 30 },
  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 40 },

  timerRow: { alignItems: "center", marginTop: 15 },

  panel: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    alignItems: "center",
    gap: 12
  },
  panelIcon: { fontSize: 44 },
  panelTitle: { color: COLORS.white, textAlign: "center", letterSpacing: 1 },
  panelSub: { color: COLORS.textSecondary, textAlign: "center", lineHeight: 20 },
  yourGroupHint: { color: COLORS.textSecondary, textAlign: "center", lineHeight: 17 },

  wordPeekBox: {
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 242, 255, 0.2)",
    borderStyle: "dashed",
    padding: 16,
    alignItems: "center",
    gap: 6
  },
  wordPeekLocked: { alignItems: "center", gap: 6 },
  wordPeekBoxRevealed: {
    borderColor: COLORS.cyan,
    borderStyle: "solid",
    backgroundColor: "rgba(0, 242, 255, 0.08)"
  },
  wordPeekLabel: { color: COLORS.cyan, letterSpacing: 2 },
  wordPeekValue: { color: COLORS.white, textAlign: "center" },
  wordPeekHidden: { color: COLORS.textSecondary, textAlign: "center" },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)"
  },
  chipEmoji: { fontSize: 14 },
  chipName: { color: COLORS.white, fontSize: 11, marginLeft: 5, maxWidth: 90 },
  chipDot: { width: 7, height: 7, borderRadius: 4, marginLeft: 6 },

  requestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 242, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(0, 242, 255, 0.3)",
    borderRadius: 15,
    padding: 14,
    marginTop: 14
  },

  scoreboard: {
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 14
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.02)"
  },
  scoreDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  scoreName: { flex: 1, color: COLORS.textSecondary, fontSize: 12 },
  scoreValue: { color: COLORS.white }
});
