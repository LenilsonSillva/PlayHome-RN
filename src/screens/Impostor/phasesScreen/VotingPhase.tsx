import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { PlayerAvatar } from "@/games/common/components/PlayerAvatar";
import { Cards } from "@/components/Cards/Cards";
import { ImpostorPlayer } from "@/games/impostor/types/game";
import { CircularTimer } from "@/components/Timer/CircularTimer";
import { useTranslation } from "react-i18next";
import { PlayerStatusModal } from "./components/PlayerStatusModal";
import { useAudio } from "@/contexts/audioContext";

interface Props {
  data: any;
  isOnline?: boolean;
  // --- Props Offline ---
  currentVoteState?: (voterId: string, targetId: string | null) => void;
  voteEnded?: (finalVotedMap: Record<string, string | null>) => void;
  // --- Props Online ---
  player?: ImpostorPlayer;
  onCastVote?: (targetId: string | null) => void;
  onVoteEnded?: () => void;
}

export const VotingPhase = ({ data, isOnline, currentVoteState, voteEnded, player, onCastVote, onVoteEnded }: Props) => {
  const { t } = useTranslation();
  const { playSound } = useAudio();
  const alivePlayers = data.players.filter((p: ImpostorPlayer) => p.isAlive);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  // ==========================================
  // 1. ESTADOS LOCAIS E TIMERS
  // ==========================================
  const [currentVoterIdx, setCurrentVoterIdx] = useState(0);

  const TOTAL_TIME = 60; // Constante global de tempo
  const serverOffset = data.serverTime ? data.serverTime - Date.now() : 0;
  const [endTime, setEndTime] = useState(() =>
    isOnline && data.votingEndTime ? data.votingEndTime : Date.now() + TOTAL_TIME * 1000
  );
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);

  const [selectedTarget, setSelectedTarget] = useState<ImpostorPlayer | null>(null);
  const [offlineVotesMap, setOfflineVotesMap] = useState<Record<string, string | null>>({});

  // ==========================================
  // 2. LÓGICA DE IDENTIFICAÇÃO (OFFLINE vs ONLINE)
  // ==========================================
  const currentVoter = isOnline ? data.players.find((p: ImpostorPlayer) => p.id === player?.id) : alivePlayers[currentVoterIdx];

  const suspects = alivePlayers.filter((p: ImpostorPlayer) => p.id !== currentVoter?.id);

  // Flags de Controle da Interface
  const isDead = isOnline && (!currentVoter || !currentVoter.isAlive);
  const hasVotedOnline = isOnline && currentVoter?.voted;
  const isWaiting = isOnline && (hasVotedOnline || isDead);
  const showTimer = !isOnline || (!hasVotedOnline && !isDead);

  const hasPlayerVoted = (p: ImpostorPlayer) => {
    return isOnline ? p.voted : offlineVotesMap[p.id] !== undefined;
  };

  // ==========================================
  // 3. EFEITOS (CRONÔMETRO IMUNE A SEGUNDO PLANO)
  // ==========================================

  // Dispara o fim da votação online quando o servidor avisar
  useEffect(() => {
    if (isOnline && data.votingFinished && onVoteEnded) {
      playSound("skip");
      setTimeout(() => {
        onVoteEnded();
      }, 100);
    }
  }, [isOnline, data.votingFinished, onVoteEnded]);

  // A) Atualiza o Timestamp dependendo do modo
  useEffect(() => {
    if (isOnline) {
      if (data.votingEndTime) setEndTime(data.votingEndTime);
    } else {
      // Offline: Reseta apenas quando o jogador mudar
      setEndTime(Date.now() + TOTAL_TIME * 1000);
      setTimeLeft(TOTAL_TIME);
    }
  }, [currentVoterIdx, isOnline, data.votingEndTime]);

  // B) Cronômetro com Timestamp Absoluto
  useEffect(() => {
    if (data.votingFinished || isWaiting) return;

    const timer = setInterval(() => {
      const now = Date.now() + serverOffset;
      const remaining = Math.max(0, Math.ceil((endTime - (Date.now() + serverOffset)) / 1000));
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, data.votingFinished, isWaiting]);

  // C) Fim do Tempo
  useEffect(() => {
    if (timeLeft === 0 && !data.votingFinished && !isWaiting) {
      playSound("skip");
      if (isOnline) {
        // 🔥 ONLINE: Fica quieto! O backend está encerrando a votação nesse exato momento.
      } else {
        // OFFLINE: Vota nulo automaticamente
        handleConfirmVote(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isOnline]);

  // ==========================================
  // 4. REGISTRO DE VOTOS
  // ==========================================
  const handleConfirmVote = (targetId: string | null) => {
    setSelectedTarget(null); // Fecha o modal instantaneamente (segurança)

    if (isOnline) {
      if (onCastVote) onCastVote(targetId);
    } else {
      const updatedMap = { ...offlineVotesMap, [currentVoter.id]: targetId };
      setOfflineVotesMap(updatedMap);

      if (currentVoteState) currentVoteState(currentVoter.id, targetId);

      if (currentVoterIdx < alivePlayers.length - 1) {
        setCurrentVoterIdx((prev) => prev + 1);
        // O tempo volta para 60 sozinho graças ao Efeito 'A' lá em cima!
      } else {
        if (voteEnded)
          setTimeout(() => {
            voteEnded(updatedMap);
          }, 220);
      }
    }
  };

  // ==========================================
  // 5. RENDERIZAÇÃO
  // ==========================================
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* CABEÇALHO COM TIMER E QUEM ESTÁ VOTANDO */}
        <View style={styles.header}>
          <View style={styles.voteTimerHeader}>
            {showTimer ? (
              <CircularTimer timeLeft={timeLeft} totalTime={TOTAL_TIME} />
            ) : isOnline && hasVotedOnline ? (
              <CustomText style={styles.timerIcon}>✅</CustomText>
            ) : isOnline && isDead ? (
              <CustomText style={styles.timerIcon}>⏳</CustomText>
            ) : (
              <CircularTimer timeLeft={timeLeft} totalTime={TOTAL_TIME} />
            )}
          </View>
          <View style={styles.voterInfo}>
            <CustomText variant="label" style={{ color: COLORS.textSecondary }}>
              {isDead ? t("games.impostor_voting_spectating") : t("games.impostor_voting_titleVotingNow")}
            </CustomText>
            <CustomText variant="h2" style={styles.voterName}>
              {currentVoter?.name || t("games.impostor_phase_spectator")}
            </CustomText>
          </View>
          <PlayerAvatar emoji={currentVoter?.emoji || "👻"} color={currentVoter?.color || COLORS.textSecondary} size={50} />
        </View>

        {/* ÁREA CENTRAL: CARDS OU LOADING */}
        <View style={styles.voteContent}>
          {isWaiting ? (
            <View style={{ alignItems: "center", paddingVertical: 40, gap: 20 }}>
              <ActivityIndicator size="large" color={COLORS.cyan} />
              <CustomText variant="h3" style={{ textAlign: "center", color: COLORS.textPrimary }}>
                {isDead ? t("games.impostor_voting_youEliminated") : t("games.impostor_voting_gotVote")}
              </CustomText>
              <CustomText variant="label" style={{ color: COLORS.textSecondary, textAlign: "center" }}>
                {t("games.impostor_voting_waitingOthers")}
              </CustomText>
            </View>
          ) : (
            <>
              <CustomText variant="h3" style={styles.instruction}>
                {t("games.impostor_voting_selectSuspect")}
              </CustomText>

              <View style={styles.grid}>
                {suspects.map((suspect: ImpostorPlayer) => (
                  <TouchableOpacity
                    key={suspect.id}
                    style={styles.cardTouch}
                    onPress={() => {
                      setSelectedTarget(suspect);
                      playSound("click2");
                    }}
                  >
                    <View style={[styles.cardContainer, { borderTopColor: suspect.color, borderTopWidth: 2 }]}>
                      <View style={styles.cardInner}>
                        <PlayerAvatar emoji={suspect.emoji} color={suspect.color} size={45} borderRadius={25} />
                        <CustomText variant="h3" numberOfLines={1} style={styles.pName}>
                          {suspect.name}
                        </CustomText>
                      </View>
                      <View style={styles.targetMark}>
                        <CustomText style={styles.targetText}>[ {t("games.impostor_voting_selectBtn")} ]</CustomText>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.nullBtn}
                onPress={() => {
                  handleConfirmVote(null);
                  playSound("skip");
                }}
              >
                <CustomText variant="label" style={{ color: COLORS.textSecondary }}>
                  {t("games.impostor_voting_skipBtn")}
                </CustomText>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* RODAPÉ: STATUS DA TRIPULAÇÃO */}
        <TouchableOpacity
          disabled={!isOnline}
          activeOpacity={0.8}
          style={styles.statusSection}
          onPress={() => {
            setStatusModalVisible(true);
            playSound("click2");
          }}
        >
          <CustomText variant="label" style={styles.statusTitle}>
            {t("games.impostor_voting_crewMateStatus")}
          </CustomText>
          <View style={styles.dotsRow}>
            {alivePlayers.map((p: ImpostorPlayer) => (
              <View key={p.id} style={[styles.dot, hasPlayerVoted(p) && styles.dotActive]} />
            ))}
          </View>
        </TouchableOpacity>
        <PlayerStatusModal
          visible={statusModalVisible}
          onClose={() => setStatusModalVisible(false)}
          players={data.players}
          statusType="voted"
        />
      </ScrollView>

      {/* MODAL DE CONFIRMAÇÃO */}
      <Modal visible={!!selectedTarget} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Cards accentColor={COLORS.danger}>
              <View style={styles.modalInner}>
                <CustomText variant="label" style={{ color: COLORS.danger }}>
                  {t("games.impostor_voting_confirmVote")}
                </CustomText>
                <View style={styles.targetPreview}>
                  <PlayerAvatar emoji={selectedTarget?.emoji || ""} color={selectedTarget?.color || ""} size={70} />
                  <CustomText variant="h2">{selectedTarget?.name.toUpperCase()}</CustomText>
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancel}
                    onPress={() => {
                      setSelectedTarget(null);
                      playSound("click2");
                    }}
                  >
                    <CustomText variant="label">{t("games.impostor_voting_back")}</CustomText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirm}
                    onPress={() => {
                      handleConfirmVote(selectedTarget!.id);
                      playSound("skip");
                    }}
                  >
                    <CustomText variant="label" style={{ color: COLORS.background }}>
                      {t("games.impostor_voting_confirm")}
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "space-between"
  },
  scroll: {
    paddingInline: 15,
    paddingBottom: 40,
    minHeight: "100%",
    justifyContent: "space-between",
    paddingTop: 140
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 20
  },
  timerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: COLORS.cyan,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.cyan,
    shadowRadius: 10,
    shadowOpacity: 0.5
  },
  timerIcon: {
    fontSize: 50,
    textAlign: "center"
  },
  voteTimerHeader: {
    alignItems: "center",
    justifyContent: "center",
    height: 80,
    width: 80
  },
  voterInfo: { flex: 1 },
  voterName: { color: COLORS.cyan, textTransform: "uppercase" },
  instruction: {
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 1,
    color: COLORS.textSecondary
  },
  voteContent: {
    paddingTop: 30,
    gap: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12
  },
  cardContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "space-evenly"
  },
  cardTouch: { width: "48%", height: 150 },
  cardInner: { alignItems: "center", gap: 8 },
  targetMark: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    width: "80%",
    alignItems: "center",
    paddingTop: 5
  },
  targetText: { fontSize: 10, color: COLORS.textSecondary, letterSpacing: 1 },
  pName: {
    fontWeight: "bold",
    textTransform: "uppercase",
    color: COLORS.textPrimary
  },
  nullBtn: {
    width: "100%",
    marginTop: 25,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderStyle: "dashed",
    borderRadius: 12
  },
  statusSection: { marginTop: 40, alignItems: "center" },
  statusTitle: { fontSize: 10, opacity: 0.5, marginBottom: 10 },
  dotsRow: { flexDirection: "row", gap: 8 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.textSecondary
  },
  dotActive: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
    shadowRadius: 5,
    shadowOpacity: 1,
    elevation: 5
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    padding: 25
  },
  modalBox: { height: 350 },
  modalInner: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center"
  },
  targetPreview: { alignItems: "center", gap: 10 },
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
