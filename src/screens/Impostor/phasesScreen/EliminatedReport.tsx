import React, { useState, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { Cards } from "@/components/Cards/Cards";
import { ImpostorPlayer } from "@/games/impostor/types/game";
import { PlayerAvatar } from "@/games/common/components/PlayerAvatar";

interface Props {
  player: ImpostorPlayer | null; // Null se for empate
  allPlayers: ImpostorPlayer[];
  votes: Record<string, string | null>;
  wasVoting: boolean; // Identifica se veio da votação ou eliminação direta
  onNext: () => void;
}

export const EliminatedReport = ({
  player,
  allPlayers,
  votes,
  wasVoting,
  onNext
}: Props) => {
  const [showLogs, setShowLogs] = useState(false);

  // Dados fictícios baseados no jogador
  const roles = [
    "Engenheiro de Dobra",
    "Pesquisador Biológico",
    "Piloto Estelar",
    "Técnico de O2",
    "Cientista de Dados"
  ];
  const playerRole = player
    ? player.isImpostor
      ? "IMPOSTOR"
      : roles[player.name.length % roles.length]
    : "";
  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  // Cálculo das estatísticas do gráfico
  const voteStats = useMemo(() => {
    const stats: Record<string, number> = {};
    allPlayers.forEach((p) => (stats[p.id] = 0));
    Object.values(votes).forEach((targetId) => {
      if (targetId && stats[targetId] !== undefined) stats[targetId]++;
    });
    return stats;
  }, [votes, allPlayers]);

  const totalVotesNull = Object.values(votes).filter((v) => v === null).length;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. SE HOUVER ELIMINADO: MOSTRA O CRACHÁ (BADGE) */}
        {player ? (
          <View style={styles.badgeWrapper}>
            <Cards accentColor={player.color}>
              <View style={styles.badgeHeader}>
                <CustomText style={styles.headerText}>
                  CREW IDENTIFICATION CARD
                </CustomText>
                <CustomText style={styles.serialText}>
                  SN-{player.id.slice(0, 5).toUpperCase()}
                </CustomText>
              </View>

              <View style={styles.badgeBody}>
                <View style={styles.avatarSection}>
                  <PlayerAvatar
                    emoji={player.emoji}
                    color={player.color}
                    size={90}
                  />
                </View>

                <View style={styles.infoSection}>
                  <View>
                    <CustomText variant="label" style={styles.smallLabel}>
                      NOME
                    </CustomText>
                    <CustomText variant="h3" numberOfLines={1}>
                      {player.name.toUpperCase()}
                    </CustomText>
                  </View>

                  <View>
                    <CustomText variant="label" style={styles.smallLabel}>
                      FUNÇÃO
                    </CustomText>
                    <CustomText
                      variant="body"
                      style={[
                        styles.infoText,
                        {
                          color: player.isImpostor
                            ? COLORS.danger
                            : COLORS.textPrimary,
                          fontSize: 14
                        }
                      ]}
                    >
                      {playerRole}
                    </CustomText>
                  </View>

                  <View>
                    <CustomText variant="label" style={styles.smallLabel}>
                      REGISTRO / STATUS
                    </CustomText>
                    <CustomText variant="body" style={styles.infoText}>
                      {date} | {time}
                    </CustomText>
                  </View>
                </View>
              </View>

              <View style={styles.stamp}>
                <CustomText style={styles.stampText}>ELIMINADO</CustomText>
              </View>
            </Cards>
          </View>
        ) : (
          /* 2. CASO DE EMPATE OU NULO: MOSTRA CARD DE AVISO */
          <View style={styles.tieWrapper}>
            <Cards accentColor={COLORS.cyan}>
              <View style={styles.tieContent}>
                <CustomText style={{ fontSize: 50 }}>⚖️</CustomText>
                <CustomText variant="h2" style={styles.tieTitle}>
                  EMPATE DETECTADO
                </CustomText>
                <CustomText variant="body" style={styles.tieSubtitle}>
                  Nenhum tripulante foi ejetado. O sistema de votação não obteve
                  maioria absoluta ou o host optou por pular.
                </CustomText>
              </View>
            </Cards>
          </View>
        )}

        {/* 3. GRÁFICO DE VOTAÇÃO (Apenas se wasVoting for true) */}
        {wasVoting && (
          <View style={styles.statsSection}>
            <CustomText variant="label" style={styles.statsTitle}>
              RESULTADO DA INTERCEPTAÇÃO
            </CustomText>

            {allPlayers.map((p) => {
              const voteShare =
                (voteStats[p.id] || 0) / (Object.keys(votes).length || 1);
              return (
                <View key={p.id} style={styles.graphRow}>
                  <CustomText style={styles.graphName} numberOfLines={1}>
                    {p.name}
                  </CustomText>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${voteShare * 100}%`,
                          backgroundColor: p.color
                        }
                      ]}
                    />
                  </View>
                  <CustomText style={styles.graphValue}>
                    {voteStats[p.id]}
                  </CustomText>
                </View>
              );
            })}

            <View
              style={[
                styles.graphRow,
                {
                  marginTop: 5,
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: "rgba(255,255,255,0.2)"
                }
              ]}
            >
              <CustomText style={styles.graphName} numberOfLines={1}>
                NULO
              </CustomText>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${((totalVotesNull || 0) / (Object.keys(votes).length || 1)) * 100}%`,
                      backgroundColor: "rgba(255,255,255,0.2)"
                    }
                  ]}
                />
              </View>
              <CustomText style={styles.graphValue}>
                {totalVotesNull || 0}
              </CustomText>
            </View>

            {/* 4. LOGS DO SISTEMA */}
            <TouchableOpacity
              style={styles.logToggle}
              onPress={() => setShowLogs(!showLogs)}
            >
              <CustomText variant="label" style={{ color: COLORS.cyan }}>
                {showLogs ? "OCULTAR LOGS DE SISTEMA" : "VER LOGS DE SISTEMA"}
              </CustomText>
            </TouchableOpacity>

            {showLogs && (
              <View style={styles.logsContainer}>
                {Object.entries(votes).map(([voterId, votedId]) => {
                  const voter = allPlayers.find((ap) => ap.id === voterId);
                  const target = allPlayers.find((ap) => ap.id === votedId);
                  return (
                    <CustomText key={voterId} style={styles.logEntry}>
                      {`> ${voter?.name || "??"} VOTOU EM ${target?.name || "NULO"}`}
                    </CustomText>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
        <CustomText variant="h3" style={{ color: COLORS.background }}>
          CONTINUAR MISSÃO
        </CustomText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingVertical: 25, alignItems: "center", flex: 1 },
  header: { alignItems: "center", marginBottom: 30 },
  headerLabel: { color: COLORS.danger, letterSpacing: 2 },
  title: { color: "#FFF" },

  // Estilos do Crachá
  badgeWrapper: { height: 280, width: "100%", maxWidth: 450, marginBottom: 40 },
  badgeHeader: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  headerText: { fontSize: 8, color: COLORS.textSecondary, fontWeight: "bold" },
  serialText: {
    fontSize: 8,
    color: COLORS.textSecondary,
    fontFamily: "monospace"
  },
  badgeBody: {
    flex: 1,
    flexDirection: "row",
    padding: 15,
    gap: 15,
    alignItems: "center"
  },
  avatarSection: { justifyContent: "center" },
  infoSection: { flex: 1, gap: 8 },
  smallLabel: { fontSize: 8, opacity: 0.5, marginBottom: 2 },
  infoText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "bold" },
  terminatedText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: "900",
    marginTop: 2
  },

  // Estilos do Carimbo
  stamp: {
    position: "absolute",
    right: 20,
    bottom: 30,
    borderWidth: 4,
    borderColor: COLORS.danger,
    padding: 8,
    borderRadius: 10,
    transform: [{ rotate: "-15deg" }],
    backgroundColor: "rgba(2, 6, 23, 0.9)",
    zIndex: 10
  },
  stampText: {
    color: COLORS.danger,
    fontWeight: "900",
    fontSize: 22,
    letterSpacing: 2
  },

  // Estilos de Empate
  tieWrapper: { height: 240, width: "100%", maxWidth: 450, marginBottom: 40 },
  tieContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10
  },
  tieTitle: { color: COLORS.cyan, textAlign: "center" },
  tieSubtitle: {
    color: COLORS.textSecondary,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20
  },

  // Estilos das Estatísticas (Gráfico)
  statsSection: { width: "100%", maxWidth: 450, marginBottom: 40, padding: 20 },
  statsTitle: { color: COLORS.cyan, marginBottom: 15, fontSize: 10 },
  graphRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10
  },
  graphName: {
    width: 80,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "bold"
  },
  barWrapper: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 4,
    overflow: "hidden"
  },
  barFill: { height: "100%", borderRadius: 4 },
  graphValue: {
    width: 20,
    textAlign: "right",
    fontSize: 12,
    color: "#FFF",
    fontWeight: "bold"
  },

  // Logs
  logToggle: {
    marginTop: 20,
    padding: 15,
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderRadius: 12
  },
  logsContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#000",
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.cyan
  },
  logEntry: {
    color: COLORS.success,
    fontFamily: "monospace",
    fontSize: 11,
    marginBottom: 5
  },

  // Botão de Próximo
  nextBtn: {
    backgroundColor: COLORS.cyan,
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    maxWidth: 450,
    marginBottom: 40,
    marginInline: 20
  }
});
