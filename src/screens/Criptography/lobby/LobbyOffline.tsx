import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions
} from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { usePlayers } from "@/contexts/contextHook";
import { categories as ALL_CATEGORIES } from "@/games/common/data/words";
import { loadGlobalUsedWords } from "@/games/common/utils/wordStorage";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { useAlert } from "@/contexts/alertContext";
import { CryptoConfig, CryptoMode } from "@/games/cryptography/types/game";
import { PLAYER_ICONS } from "@/games/common/constants/icons";
import { pickRandom } from "@/games/common/utils/array";

export const LobbyOffline = () => {
  const navigation = useNavigation<any>();
  const { players, addPlayer, removePlayer, updatePlayer } = usePlayers();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 600;
  const { showAlert } = useAlert();

  // --- Estados de Configuração ---
  const [mode, setMode] = useState<CryptoMode>("infiltration");
  const [distributionType, setDistributionType] = useState<"random" | "manual">("random");
  const [name, setName] = useState("");
  const [teamCount, setTeamCount] = useState(2);
  const [selectedTime, setSelectedTime] = useState(60);
  const [wordLimit, setWordLimit] = useState(5);
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([...ALL_CATEGORIES]);

  const [manualAssignments, setManualAssignments] = useState<Record<string, number>>({});

  const infiltrationTimes = [60, 90, 120];
  const interceptionTimes = [15, 30, 60];

  useEffect(() => {
    setSelectedTime(mode === "infiltration" ? 60 : 15);
  }, [mode]);

  useEffect(() => {
    setManualAssignments((prev) => {
      const newMap = { ...prev };
      players.forEach((p) => {
        if (newMap[p.id] === undefined || newMap[p.id] >= teamCount) {
          newMap[p.id] = 0;
        }
      });
      return newMap;
    });
  }, [players, teamCount]);

  // Lógica de Emojis Únicos
  const getUnusedEmoji = useCallback(() => {
    const usedEmojis = players.map((p) => p.emoji);
    const available = PLAYER_ICONS.filter((icon) => !usedEmojis.includes(icon));
    return available.length > 0 ? pickRandom(available) : "❓";
  }, [players]);

  const handleAddPlayer = () => {
    if (name.trim() && players.length < 20) {
      // 🔥 Adicionado o sorteio de emoji para bater com o padrão
      addPlayer(name.trim(), getUnusedEmoji());
      setName("");
    }
  };

  const handleChangeEmoji = (id: string) => {
    updatePlayer(id, { emoji: getUnusedEmoji() });
  };

  const cycleTeamAssignment = (playerId: string) => {
    setManualAssignments((prev) => ({
      ...prev,
      [playerId]: ((prev[playerId] || 0) + 1) % teamCount
    }));
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const handleStartMission = async () => {
    if (players.length < teamCount) {
      showAlert(t("alerts.error"), t("alerts.cryptography_lobby_feewPlayers"));
      return;
    }

    if (distributionType === "manual") {
      const teamCounts = new Array(teamCount).fill(0);
      players.forEach((p) => teamCounts[manualAssignments[p.id] || 0]++);
      if (teamCounts.some((count) => count === 0)) {
        showAlert(t("alerts.warning"), t("games.cryptography_alert_emptyTeam"));
        return;
      }
    }

    const config: CryptoConfig = {
      mode,
      teamCount,
      distributionType,
      roundTime: selectedTime,
      wordLimit,
      categories: selectedCategories
    };

    const globalUsedWords = await loadGlobalUsedWords();

    navigation.navigate("OfflineCryptographyGame", { config, manualAssignments, globalUsedWords });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* HEADER DE MODOS DE JOGO */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "infiltration" && styles.modeActive]}
            onPress={() => setMode("infiltration")}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="run-fast"
              size={24}
              color={mode === "infiltration" ? COLORS.cyan : COLORS.textSecondary}
            />
            <CustomText variant="label" style={{ color: mode === "infiltration" ? COLORS.cyan : COLORS.textSecondary }}>
              {t("games.cryptography_phase_infiltration_action")}
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, mode === "interception" && styles.modeActive]}
            onPress={() => setMode("interception")}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={24}
              color={mode === "interception" ? COLORS.danger : COLORS.textSecondary}
            />
            <CustomText variant="label" style={{ color: mode === "interception" ? COLORS.danger : COLORS.textSecondary }}>
              {t("games.cryptography_phase_interception_action")}
            </CustomText>
          </TouchableOpacity>
        </View>

        <View style={styles.descBox}>
          <CustomText variant="body" style={styles.descText}>
            {mode === "infiltration" ? t("games.cryptography_infiltration_desc") : t("games.cryptography_interception_desc")}
          </CustomText>
        </View>

        {/* DISTRIBUIÇÃO */}
        <View style={styles.section}>
          <CustomText variant="label" style={styles.cyanText}>
            {t("games.cryptography_lobby_distribution")}
          </CustomText>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segBtn, distributionType === "random" && styles.activeSeg]}
              onPress={() => setDistributionType("random")}
            >
              <CustomText style={[styles.segText, distributionType === "random" && { color: COLORS.cyan }]}>
                {t("games.cryptography_lobby_random")}
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segBtn, distributionType === "manual" && styles.activeSeg]}
              onPress={() => setDistributionType("manual")}
            >
              <CustomText style={[styles.segText, distributionType === "manual" && { color: COLORS.cyan }]}>
                {t("games.cryptography_lobby_manual")}
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>

        {/* QTD ESQUADRÕES */}
        <View style={styles.settingCard}>
          <View>
            <CustomText variant="h3">{t("games.cryptography_lobby_groupCount")}</CustomText>
          </View>
          <View style={styles.counter}>
            <TouchableOpacity
              onPress={() => setTeamCount(Math.max(2, teamCount - 1))}
              style={[styles.cBtn, teamCount === 2 && styles.btnDisabled]}
              disabled={teamCount === 2}
            >
              <CustomText variant="h2" style={{ color: "#FFF" }}>
                -
              </CustomText>
            </TouchableOpacity>
            <CustomText variant="h2" style={styles.cValue}>
              {teamCount}
            </CustomText>
            <TouchableOpacity
              onPress={() => setTeamCount(Math.min(players.length, teamCount + 1))}
              style={[styles.cBtn, teamCount >= players.length && styles.btnDisabled]}
              disabled={teamCount >= players.length}
            >
              <CustomText variant="h2" style={{ color: "#FFF" }}>
                +
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>

        {/* ADICIONAR JOGADORES */}
        <View style={styles.section}>
          <CustomText variant="label" style={styles.cyanText}>
            {t("games.cryptography_lobby_crewmates")} ({players.length}/20)
          </CustomText>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder={t("games.cryptography_lobby_playerName")}
              placeholderTextColor={COLORS.textSecondary}
              value={name}
              onChangeText={setName}
              maxLength={15}
              onSubmitEditing={handleAddPlayer}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddPlayer}>
              <CustomText variant="h2" style={{ color: COLORS.background }}>
                +
              </CustomText>
            </TouchableOpacity>
          </View>

          {/* 🔥 NOVA LISTA DE JOGADORES (Igual a do Impostor) */}
          <View style={styles.playerList}>
            {players.map((p) => (
              <View key={p.id} style={[styles.playerCard, { width: isLargeScreen ? "48.5%" : "100%" }]}>
                <TouchableOpacity style={styles.emojiCircle} onPress={() => handleChangeEmoji(p.id)}>
                  <CustomText style={{ fontSize: 34 }}>{p.emoji || "👤"}</CustomText>
                  <View style={styles.editIconBadge}>
                    <MaterialCommunityIcons name="reload" size={11} color={COLORS.cyan} />
                  </View>
                </TouchableOpacity>

                <CustomText variant="h3" style={styles.playerName}>
                  {p.name}
                </CustomText>

                <View style={styles.playerActions}>
                  {distributionType === "manual" && (
                    <TouchableOpacity style={styles.teamTag} onPress={() => cycleTeamAssignment(p.id)}>
                      <CustomText variant="label" style={{ color: COLORS.background }}>
                        {t("games.cryptography_lobby_group")} {(manualAssignments[p.id] || 0) + 1} ↻
                      </CustomText>
                    </TouchableOpacity>
                  )}

                  {/* Se for manual o botão vira apenas um "X", se for aleatório, mostra o botão "REMOVER" completo */}
                  <TouchableOpacity
                    onPress={() => removePlayer(p.id)}
                    style={[styles.removeBtn, distributionType === "manual" && styles.removeBtnSmall]}
                  >
                    <CustomText style={styles.removeText}>
                      {distributionType === "manual" ? "X" : t("games.cryptography_lobby_remove")}
                    </CustomText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* CRONÔMETRO E PALAVRAS */}
        <View style={styles.section}>
          <CustomText variant="label" style={styles.cyanText}>
            {t("games.cryptography_lobby_timer")}
          </CustomText>
          <View style={styles.optionsRow}>
            {(mode === "infiltration" ? infiltrationTimes : interceptionTimes).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.optionChip, selectedTime === t && styles.optionActive]}
                onPress={() => setSelectedTime(t)}
              >
                <CustomText variant="h3" style={{ color: selectedTime === t ? COLORS.background : COLORS.textSecondary }}>
                  {t}s
                </CustomText>
              </TouchableOpacity>
            ))}
          </View>

          {mode === "interception" && (
            <View style={{ marginTop: 25 }}>
              <CustomText variant="label" style={styles.cyanText}>
                {t("games.cryptography_lobby_wordLimit")}
              </CustomText>
              <View style={styles.optionsRow}>
                {[5, 10, 20].map((w) => (
                  <TouchableOpacity
                    key={w}
                    style={[styles.optionChip, wordLimit === w && styles.optionActive]}
                    onPress={() => setWordLimit(w)}
                  >
                    <CustomText variant="h3" style={{ color: wordLimit === w ? COLORS.background : COLORS.textSecondary }}>
                      {w}
                    </CustomText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* BANCO DE DADOS */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.categoryToggle, showCategories && styles.categoryToggleActive]}
            onPress={() => setShowCategories(!showCategories)}
          >
            <CustomText variant="label" style={{ color: showCategories ? COLORS.black : COLORS.cyan }}>
              {showCategories ? t("games.cryptography_lobby_close") + " ⇡" : t("games.cryptography_lobby_db") + " ⇣"}
            </CustomText>
          </TouchableOpacity>

          {showCategories && (
            <View style={styles.categoryGrid}>
              {ALL_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, isSelected && styles.activeChip]}
                    onPress={() => toggleCategory(cat)}
                  >
                    <CustomText style={[styles.categoryText, isSelected && styles.activeCategoryText]}>{cat}</CustomText>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* BOTÃO FIXO NO RODAPÉ */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startBtn, players.length < teamCount && { opacity: 0.5 }]}
          disabled={players.length < teamCount}
          onPress={handleStartMission}
        >
          <CustomText variant="h2" style={styles.startBtnText}>
            {t("games.cryptography_lobby_start")}
          </CustomText>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingTop: 10, paddingBottom: 150 },
  section: { marginBottom: 35 },
  cyanText: { color: COLORS.cyan, marginBottom: 15, letterSpacing: 2 },

  modeSelector: { flexDirection: "row", gap: 10, marginBottom: 15 },
  modeBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.02)"
  },
  modeActive: { borderColor: COLORS.cyan, backgroundColor: "rgba(0, 242, 255, 0.05)" },
  descBox: {
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  descText: { color: COLORS.textSecondary, textAlign: "center", fontSize: 12 },

  segmentedControl: { flexDirection: "row", backgroundColor: COLORS.surface, borderRadius: 14, padding: 4 },
  segBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  activeSeg: { backgroundColor: COLORS.surfaceLight },
  segText: { fontSize: 12, fontWeight: "bold", color: COLORS.textSecondary },

  settingCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  counter: { flexDirection: "row", alignItems: "center", gap: 15 },
  btnDisabled: { opacity: 0.2 },
  cBtn: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  cValue: { minWidth: 30, textAlign: "center", color: COLORS.cyan },

  inputGroup: { flexDirection: "row", gap: 10, marginBottom: 15 },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    color: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    fontSize: 16
  },
  addBtn: { backgroundColor: COLORS.cyan, width: 60, borderRadius: 14, justifyContent: "center", alignItems: "center" },

  playerList: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },

  // 🔥 Estilos Novos da PlayerCard (Iguais ao Impostor)
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)"
  },
  emojiCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cyan
  },
  editIconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.cyan
  },
  playerName: { flex: 1, marginLeft: 15, color: "#FFF", fontSize: 16 },

  playerActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  teamTag: { backgroundColor: COLORS.cyan, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },

  // 🔥 Estilos de Remoção adaptáveis
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,0,60,0.1)",
    alignItems: "center",
    justifyContent: "center"
  },
  removeBtnSmall: {
    width: 30,
    height: 30,
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  removeText: { color: COLORS.danger, fontWeight: "bold", fontSize: 12 },

  optionsRow: { flexDirection: "row", gap: 10 },
  optionChip: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center"
  },
  optionActive: { backgroundColor: COLORS.cyan, borderColor: COLORS.cyan },

  categoryToggle: { padding: 20, borderRadius: 15, borderWidth: 1, borderColor: COLORS.cyan, alignItems: "center" },
  categoryToggleActive: { backgroundColor: COLORS.cyan },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 15 },
  categoryChip: {
    width: "48.5%",
    padding: 18,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  activeChip: { backgroundColor: COLORS.cyan, borderColor: "#FFF" },
  categoryText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "800" },
  activeCategoryText: { color: COLORS.background, fontWeight: "bold" },

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
  startBtn: {
    backgroundColor: COLORS.cyan,
    padding: 22,
    borderRadius: 20,
    alignItems: "center",
    elevation: 15,
    shadowColor: COLORS.cyan,
    shadowRadius: 20,
    shadowOpacity: 0.6
  },
  startBtnText: { color: COLORS.black, letterSpacing: 2 }
});
