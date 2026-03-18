import React, { useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { useTranslation } from "react-i18next";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { CryptoGameState } from "@/games/cryptography/types/game";
import { useAlert } from "@/contexts/alertContext";

interface TeamRevealProps {
  gameState: CryptoGameState;
  onSelectOperator: (teamId: string, playerId: string) => void;
  onRandomizeOperators: () => void;
  onSetStartingTeam: (teamIndex: number) => void;
  onConfirm: () => void;
}

export const TeamRevealPhase = ({
  gameState,
  onSelectOperator,
  onRandomizeOperators,
  onSetStartingTeam,
  onConfirm
}: TeamRevealProps) => {
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  const handleConfirm = () => {
    // Valida se todos os times tem operador antes de prosseguir
    const missingOperators = gameState.teams.some((t) => !t.operatorId);
    if (missingOperators) {
      showAlert(
        "Atenção!",
        t("games.cryptography_reveal_instruction", "Defina quem será o Operador de cada esquadrão antes de prosseguir.")
      );
      return;
    }
    onConfirm();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Altura para a StatusBar transparente*/}
        <View style={{ height: 110 }} />

        <View style={styles.header}>
          <View style={styles.badge}>
            <CustomText variant="label" style={styles.badgeText}>
              {t("games.cryptography_reveal_badge", "RECONHECIMENTO DE UNIDADES")}
            </CustomText>
          </View>
          <CustomText variant="h2" style={styles.title}>
            {t("games.cryptography_reveal_title", "ESQUADRÕES FORMADOS")}
          </CustomText>
        </View>

        {/* 🔥 BOTAO PARA SORTEAR TODOS OS OPERADORES RAPIDAMENTE */}
        <TouchableOpacity style={styles.randomAllBtn} onPress={onRandomizeOperators} activeOpacity={0.8}>
          <MaterialCommunityIcons name="dice-multiple" size={20} color={COLORS.cyan} />
          <CustomText variant="h3" style={{ color: COLORS.cyan }}>
            {t("games.cryptography_reveal_randomBtn", "SORTEAR OPERADORES")}
          </CustomText>
        </TouchableOpacity>

        <View style={styles.grid}>
          {gameState.teams.map((team, idx) => (
            <View key={team.id} style={[styles.teamCard, { borderColor: team.color }]}>
              {/* HEADER DO ESQUADRÃO COM LAYOUT AJUSTADO PARA O BOTÃO DE INICIAR */}
              <View style={[styles.teamHeader, { justifyContent: "space-between" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
                  <CustomText variant="h1" style={[styles.teamIndex, { color: team.color }]}>
                    0{idx + 1}
                  </CustomText>
                  <CustomText variant="h2" style={styles.teamName}>
                    {team.name}
                  </CustomText>
                </View>

                {/* 🔥 BOTAO DE QUEM INICIA A RODADA (Aparece apenas na Rodada 1) */}
                {gameState.roundNumber === 1 && (
                  <TouchableOpacity
                    style={[
                      styles.startTeamBtn,
                      gameState.currentTeamIndex === idx && { backgroundColor: team.color, borderColor: team.color }
                    ]}
                    onPress={() => onSetStartingTeam(idx)}
                    activeOpacity={0.7}
                  >
                    <CustomText
                      variant="label"
                      style={{
                        color: gameState.currentTeamIndex === idx ? COLORS.background : COLORS.textSecondary,
                        fontSize: 9
                      }}
                    >
                      {gameState.currentTeamIndex === idx ? "⭐ COMEÇA" : "DEFINIR 1º"}
                    </CustomText>
                  </TouchableOpacity>
                )}
              </View>

              <CustomText variant="label" style={styles.instruction}>
                {t("games.cryptography_reveal_selectOperator", "SELECIONE O OPERADOR:")}
              </CustomText>

              {/* GRID DE AGENTES */}
              <View style={styles.playersGrid}>
                {team.players.map((player) => {
                  const isOperator = team.operatorId === player.id;

                  return (
                    <TouchableOpacity
                      key={player.id}
                      style={[
                        styles.gridItem,
                        isOperator
                          ? { backgroundColor: team.color + "20", borderColor: team.color, borderWidth: 2 }
                          : { borderTopWidth: 1, borderTopColor: player.color }
                      ]}
                      onPress={() => onSelectOperator(team.id, player.id)}
                      activeOpacity={0.7}
                    >
                      <CustomText variant="label" style={styles.operatorText}>
                        {isOperator ? "OPERADOR" : ""}
                      </CustomText>
                      <View style={styles.playerData}>
                        <CustomText style={styles.playerEmoji}>{player.emoji}</CustomText>

                        <CustomText
                          variant="label"
                          numberOfLines={1}
                          style={{ color: isOperator ? COLORS.white : COLORS.textSecondary, fontSize: 15 }}
                        >
                          {player.name}
                        </CustomText>
                      </View>

                      {/* Distintivo de Operador Tático (Estrela) */}
                      {isOperator && (
                        <View style={[styles.operatorBadgeGrid, { backgroundColor: team.color }]}>
                          <MaterialCommunityIcons name="star" size={12} color={COLORS.background} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.9}>
          <CustomText variant="h2" style={{ color: COLORS.background }}>
            {t("games.cryptography_reveal_confirmBtn", "TUDO PRONTO 🚀")}
          </CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 150 },
  header: { alignItems: "center", marginBottom: 25 },
  badge: {
    backgroundColor: "rgba(0, 242, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 242, 255, 0.3)"
  },
  badgeText: { color: COLORS.cyan, letterSpacing: 1 },
  title: { color: COLORS.white, letterSpacing: 2 },
  randomAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(0, 242, 255, 0.05)",
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 242, 255, 0.2)",
    borderStyle: "dashed"
  },
  grid: { gap: 20 },

  teamCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, borderWidth: 2, gap: 10 },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    paddingBottom: 15
  },
  // 🔥 Estilo adicionado para o novo botão do topo da carta
  startTeamBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.2)"
  },
  teamIndex: { fontSize: 40, fontWeight: "900", opacity: 0.8 },
  teamName: { color: COLORS.white, textTransform: "uppercase" },
  instruction: { color: COLORS.textSecondary, marginBottom: 10 },

  playersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  gridItem: {
    width: "48%", // 🔥 Única alteração: Garante um grid de 2 colunas!
    aspectRatio: 1, // Quadrado perfeito
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center"
  },
  playerEmoji: {
    fontSize: 40,
    marginBottom: 8
  },
  operatorBadgeGrid: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.surface // O contorno finge um "corte" no card base
  },
  operatorText: {
    flex: 0.5,
    top: 10,
    color: COLORS.textSecondary
  },
  playerData: {
    flex: 1.5,
    alignItems: "center"
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)"
  },
  confirmBtn: {
    flex: 1,
    padding: 22,
    borderRadius: 15,
    backgroundColor: COLORS.cyan,
    alignItems: "center",
    elevation: 10,
    shadowColor: COLORS.cyan,
    shadowRadius: 15,
    shadowOpacity: 0.4
  }
});
