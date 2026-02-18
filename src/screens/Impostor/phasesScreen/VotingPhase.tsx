import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal
} from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { PlayerAvatar } from "@/games/common/components/PlayerAvatar";
import { Cards } from "@/components/Cards/Cards";
import { ImpostorGame, ImpostorPlayer } from "@/games/impostor/types/game";
import { CircularTimer } from "@/components/Timer/CircularTimer";
import { useTranslation } from "react-i18next";

interface Props {
  data: ImpostorGame;
  voteEnded: (finalVotedMap: Record<string, string | null>) => void;
  currentVoteState: (voterId: string, targetId: string | null) => void;
}

export const VotingPhase = ({ data, voteEnded, currentVoteState }: Props) => {
  const { t } = useTranslation();
  const alivePlayers = data.players.filter((p) => p.isAlive);
  const [currentVoterIdx, setCurrentVoterIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedTarget, setSelectedTarget] = useState<ImpostorPlayer | null>(
    null
  );
  const [votedMap, setVotedMap] = useState<Record<string, string | null>>({});

  const currentVoter = alivePlayers[currentVoterIdx];
  const suspects = alivePlayers.filter((p) => p.id !== currentVoter.id);

  // Timer de 60 segundos
  useEffect(() => {
    if (timeLeft <= 0) {
      handleConfirmVote(null);
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, currentVoterIdx]);

  // Quando um voto é confirmado, atualiza o estado, passa o voto para o hook no componente pai e passa para o próximo votante ou encerra a votação
  const handleConfirmVote = (targetId: string | null) => {
    const updatedMap = { ...votedMap, [currentVoter.id]: targetId };
    setVotedMap(updatedMap);
    currentVoteState(currentVoter.id, targetId);
    setSelectedTarget(null);

    if (currentVoterIdx < alivePlayers.length - 1) {
      setCurrentVoterIdx((prev) => prev + 1);
      setTimeLeft(60);
    } else {
      voteEnded(updatedMap);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <CircularTimer timeLeft={timeLeft} totalTime={60} />
          <View style={styles.voterInfo}>
            <CustomText variant="label" style={{ color: COLORS.textSecondary }}>
              {t("games.impostor_voting_titleVotingNow")}
            </CustomText>
            <CustomText variant="h2" style={styles.voterName}>
              {currentVoter.name}
            </CustomText>
          </View>
          <PlayerAvatar
            emoji={currentVoter.emoji}
            color={currentVoter.color}
            size={50}
          />
        </View>

        <View style={styles.voteContent}>
          <CustomText variant="h3" style={styles.instruction}>
            {t("games.impostor_voting_selectSuspect")}
          </CustomText>
          <View style={styles.grid}>
            {suspects.map((player) => (
              <TouchableOpacity
                key={player.id}
                style={styles.cardTouch}
                onPress={() => setSelectedTarget(player)}
              >
                <View
                  style={[
                    styles.cardContainer,
                    { borderTopColor: player.color, borderTopWidth: 2 }
                  ]}
                >
                  <View style={styles.cardInner}>
                    <PlayerAvatar
                      emoji={player.emoji}
                      color={player.color}
                      size={45}
                      borderRadius={25}
                    />
                    <CustomText
                      variant="h3"
                      numberOfLines={1}
                      style={styles.pName}
                    >
                      {player.name}
                    </CustomText>
                  </View>
                  <View style={styles.targetMark}>
                    <CustomText style={styles.targetText}>
                      [ {t("games.impostor_voting_selectBtn")} ]
                    </CustomText>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.nullBtn}
            onPress={() => handleConfirmVote(null)}
          >
            <CustomText variant="label" style={{ color: COLORS.textSecondary }}>
              {t("games.impostor_voting_skipBtn")}
            </CustomText>
          </TouchableOpacity>
        </View>

        <View style={styles.statusSection}>
          <CustomText variant="label" style={styles.statusTitle}>
            {t("games.impostor_voting_crewMateStatus")}
          </CustomText>
          <View style={styles.dotsRow}>
            {alivePlayers.map((p) => (
              <View
                key={p.id}
                style={[
                  styles.dot,
                  votedMap[p.id] !== undefined && styles.dotActive
                ]}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal visible={!!selectedTarget} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Cards accentColor={COLORS.danger}>
              <View style={styles.modalInner}>
                <CustomText variant="label" style={{ color: COLORS.danger }}>
                  {t("games.impostor_voting_confirmVote")}
                </CustomText>
                <View style={styles.targetPreview}>
                  <PlayerAvatar
                    emoji={selectedTarget?.emoji || ""}
                    color={selectedTarget?.color || ""}
                    size={70}
                  />
                  <CustomText variant="h2">
                    {selectedTarget?.name.toUpperCase()}
                  </CustomText>
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancel}
                    onPress={() => setSelectedTarget(null)}
                  >
                    <CustomText variant="label">
                      {t("games.impostor_voting_back")}
                    </CustomText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirm}
                    onPress={() => handleConfirmVote(selectedTarget!.id)}
                  >
                    <CustomText
                      variant="label"
                      style={{ color: COLORS.background }}
                    >
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
