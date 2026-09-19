import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { useTranslation } from "react-i18next";
import { ImpostorBackground } from "@/components/Background/Background";
import type { CryptoView } from "@/games/cryptography/types/online";
import { WordPeek, TeamChips, ScoreboardPanel, useServerCountdown } from "./OnlineWaitingScreen";
import { CircularTimer } from "@/components/Timer/CircularTimer";
import { serverTimeOffset } from "@/games/cryptography/utils/onlineViewMapper";

// ============================================================
// CONSENSO DOS OPERADORES — troca de palavra (Interceptação)
//
// Regra do usuário: somente operadores trocam a palavra, e por
// CONSENSO — quando um solicita, os demais operadores precisam
// aceitar. Enquanto a solicitação estiver pendente, o tempo
// permanece parado para todo mundo (o servidor bloqueia as ações).
// ============================================================
interface WordChangeConsensusProps {
  view: CryptoView;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export const WordChangeConsensus = ({ view, onApprove, onReject }: WordChangeConsensusProps) => {
  const { t } = useTranslation();
  const request = view.wordChangeRequest;
  const currentTeam = view.teams[view.currentTeamIndex];
  // memo por view: o offset só muda quando chega view nova do servidor
  const serverOffset = useMemo(() => serverTimeOffset(view.serverTime), [view.serverTime]);
  const timeLeft = useServerCountdown(view.roundEndTime, view.config.roundTime, serverOffset);

  if (!request) return null;

  const myId = view.actingPlayerId ?? view.myPlayerId;
  const isRequester = request.requesterId === myId;
  const hasApproved = !!myId && request.approvedBy.includes(myId);
  const agreed = request.approvedBy.length;
  const total = Math.max(request.operatorIds.length, 1);

  return (
    <View style={styles.container}>
      <ImpostorBackground />

      <View style={styles.content}>
        <View style={{ height: 115 }} />

        {timeLeft != null && (
          <View style={styles.timerRow}>
            <CircularTimer timeLeft={timeLeft} totalTime={view.config.roundTime} />
          </View>
        )}

        <View style={styles.panel}>
          <CustomText style={styles.icon}>🗳️</CustomText>
          <CustomText variant="h2" style={styles.title}>
            {t("games.cryptography_online_game_wordChangeRequested")}
          </CustomText>
          <CustomText variant="label" style={styles.sub} numberOfLines={3}>
            <CustomText style={{ color: COLORS.white, fontWeight: "900" }}>{request.requesterName}</CustomText>{" "}
            {t("games.cryptography_online_game_requestedNewWord")}
          </CustomText>

          <WordPeek view={view} hiddenText={t("games.cryptography_online_game_onlyOperatorSees")} />

          {/* STATUS DO CONSENSO */}
          <View style={styles.consensusBox}>
            <CustomText variant="label" style={styles.consensusLabel}>
              {t("games.cryptography_online_game_operatorsAgreed")}
            </CustomText>
            <CustomText variant="h1" style={styles.consensusValue}>
              {agreed} / {total}
            </CustomText>
            <View style={styles.consensusDots}>
              {request.operatorIds.map((opId) => (
                <View
                  key={opId}
                  style={[
                    styles.consensusDot,
                    { backgroundColor: request.approvedBy.includes(opId) ? COLORS.success : "rgba(255,255,255,0.12)" }
                  ]}
                />
              ))}
            </View>
          </View>

          {/* AÇÕES DOS OPERADORES */}
          {view.controls.canApproveWordChange || view.controls.canRejectWordChange ? (
            <View style={styles.actionsRow}>
              {view.controls.canApproveWordChange && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.acceptBtn]}
                  onPress={() => onApprove(request.id)}
                  activeOpacity={0.85}
                >
                  <CustomText variant="h3" style={{ color: COLORS.background, fontWeight: "900" }}>
                    ✅ {t("games.cryptography_online_game_acceptChange")}
                  </CustomText>
                </TouchableOpacity>
              )}
              {view.controls.canRejectWordChange && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => onReject(request.id)}
                  activeOpacity={0.85}
                >
                  <CustomText variant="h3" style={{ color: COLORS.danger, fontWeight: "900" }}>
                    ❌ {t("games.cryptography_online_game_rejectContinue")}
                  </CustomText>
                </TouchableOpacity>
              )}
            </View>
          ) : isRequester ? (
            <CustomText variant="label" style={styles.note}>
              ✅ {t("games.cryptography_online_game_requestRegistered")}
            </CustomText>
          ) : hasApproved ? (
            <CustomText variant="label" style={styles.note}>
              ✅ {t("games.cryptography_online_game_alreadyAccepted")}
            </CustomText>
          ) : (
            <CustomText variant="label" style={styles.note}>
              ⏳ {t("games.cryptography_online_game_waitingConsensus")}
            </CustomText>
          )}
        </View>

        <View style={styles.bottomStack}>
          <TeamChips team={currentTeam} />
          <ScoreboardPanel teams={view.teams} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 40, justifyContent: "space-between" },

  timerRow: { alignItems: "center" },

  panel: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.amber + "60",
    padding: 24,
    alignItems: "center",
    gap: 14
  },
  icon: { fontSize: 44 },
  title: { color: COLORS.amber, textAlign: "center", letterSpacing: 1 },
  sub: { color: COLORS.textSecondary, textAlign: "center", lineHeight: 20 },

  consensusBox: {
    alignSelf: "stretch",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 14
  },
  consensusLabel: { color: COLORS.textSecondary, letterSpacing: 2 },
  consensusValue: { color: COLORS.success, marginTop: 2 },
  consensusDots: { flexDirection: "row", gap: 8, marginTop: 10 },
  consensusDot: { width: 12, height: 12, borderRadius: 6 },

  actionsRow: { flexDirection: "row", gap: 10, alignSelf: "stretch" },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    elevation: 6
  },
  acceptBtn: { backgroundColor: COLORS.success },
  rejectBtn: { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1.5, borderColor: COLORS.danger + "70" },

  note: { color: COLORS.textSecondary, textAlign: "center", lineHeight: 20 },

  bottomStack: { gap: 12, alignItems: "center" }
});