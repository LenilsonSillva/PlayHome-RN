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

interface Props {
  data: ImpostorGame;
  voteEnded: (finalVotedMap: Record<string, string | null>) => void;
  currentVoteState: (voterId: string, targetId: string | null) => void;
}

export const VotingPhase = ({ data, voteEnded, currentVoteState }: Props) => {
  const alivePlayers = data.players.filter((p) => p.isAlive);
  const [currentVoterIdx, setCurrentVoterIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedTarget, setSelectedTarget] = useState<ImpostorPlayer | null>(
    null
  );
  const [votedMap, setVotedMap] = useState<Record<string, string | null>>({}); // 🔥 Controle local

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
      voteEnded(updatedMap); // 🔥 Envia o mapa completo e síncrono
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.timerCircle}>
            <CustomText
              variant="h2"
              style={{ color: timeLeft <= 10 ? COLORS.danger : COLORS.cyan }}
            >
              {timeLeft}s
            </CustomText>
          </View>
          <View style={styles.voterInfo}>
            <CustomText variant="label">VOTANDO AGORA</CustomText>
            <CustomText variant="h2" style={styles.voterName}>
              {currentVoter.name}
            </CustomText>
          </View>
        </View>

        <CustomText variant="h3" style={styles.instruction}>
          SELECIONE O SUSPEITO:
        </CustomText>

        <View style={styles.grid}>
          {suspects.map((player) => (
            <TouchableOpacity
              key={player.id}
              style={styles.cardTouch}
              onPress={() => setSelectedTarget(player)}
            >
              <Cards accentColor={player.color}>
                <View style={styles.cardInner}>
                  <PlayerAvatar
                    emoji={player.emoji}
                    color={player.color}
                    size={45}
                    hideScan
                  />
                  <CustomText
                    variant="body"
                    numberOfLines={1}
                    style={styles.pName}
                  >
                    {player.name}
                  </CustomText>
                </View>
              </Cards>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.nullBtn}
          onPress={() => handleConfirmVote(null)}
        >
          <CustomText variant="label" style={{ color: COLORS.textSecondary }}>
            ABSTER-SE / VOTO NULO
          </CustomText>
        </TouchableOpacity>

        <View style={styles.statusSection}>
          <CustomText variant="label" style={styles.statusTitle}>
            STATUS DA TRIPULAÇÃO
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
                  CONFIRMAÇÃO DE VOTO
                </CustomText>
                <View style={styles.targetPreview}>
                  <PlayerAvatar
                    emoji={selectedTarget?.emoji || ""}
                    color={selectedTarget?.color || ""}
                    size={70}
                  />
                  <CustomText variant="h2">{selectedTarget?.name}</CustomText>
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancel}
                    onPress={() => setSelectedTarget(null)}
                  >
                    <CustomText variant="label">VOLTAR</CustomText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirm}
                    onPress={() => handleConfirmVote(selectedTarget!.id)}
                  >
                    <CustomText
                      variant="label"
                      style={{ color: COLORS.background }}
                    >
                      CONFIRMAR
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
  scroll: { padding: 25, paddingBottom: 50 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 30,
    backgroundColor: "rgba(255,255,255,0.03)",
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
  instruction: { marginBottom: 20, textAlign: "center", letterSpacing: 1 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12
  },
  cardTouch: { width: "48%", height: 130 },
  cardInner: { alignItems: "center", gap: 8 },
  pName: { fontWeight: "bold", textTransform: "uppercase" },
  nullBtn: {
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
