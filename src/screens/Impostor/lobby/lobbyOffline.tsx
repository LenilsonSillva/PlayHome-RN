import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions
} from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { usePlayers } from "@/contexts/contextHook";
import { getImpostorCount } from "@/games/impostor/logic/initializeGame";
import { categories as ALL_CATEGORIES } from "@/games/common/data/words"; // Importando do seu caminho
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "App";
import { PLAYER_ICONS } from "@/games/impostor/constants/icons";
import { pickRandom } from "@/games/common/utils/array";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";

export const LobbyOffline = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { players, addPlayer, removePlayer, updatePlayer } = usePlayers();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 600;

  // Estados de Configuração
  const [name, setName] = useState("");
  const [impostorCount, setImpostorCount] = useState(1);
  const [twoWords, setTwoWords] = useState(false);
  const [whoStarts, setWhoStarts] = useState(true);
  const [impostorCanStart, setImpostorCanStart] = useState(true);
  const [hasHint, setHasHint] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    ...ALL_CATEGORIES
  ]);

  // Calcula o limite máximo permitido de impostores
  const maxImpostors = useMemo(
    () => getImpostorCount(players.length),
    [players.length]
  );

  // Efeito para ajustar a contagem se jogadores forem removidos
  useEffect(() => {
    if (impostorCount > maxImpostors) {
      setImpostorCount(maxImpostors);
    }
  }, [maxImpostors]);

  useEffect(() => {
    if (!whoStarts) {
      setImpostorCanStart(false);
    }
  }, [whoStarts]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleAddPlayer = () => {
    if (name.trim()) {
      addPlayer(name, getUnusedEmoji());
      setName("");
    }
  };

  // Lógica de Emojis Únicos
  const getUnusedEmoji = useCallback(() => {
    const usedEmojis = players.map((p) => p.emoji);
    const available = PLAYER_ICONS.filter((icon) => !usedEmojis.includes(icon));
    return available.length > 0 ? pickRandom(available) : "❓";
  }, [players]);

  const handleChangeEmoji = (id: string) => {
    updatePlayer(id, { emoji: getUnusedEmoji() });
  };

  const handleStartMission = () => {
    // 1. Preparamos o objeto de configuração
    const config = {
      impostorCount,
      twoWordsMode: twoWords,
      impostorHasHint: hasHint,
      selectedCategories,
      whoStartButton: whoStarts,
      impostorCanStart
    };

    // 2. Navegamos para a tela da Partida passando os parâmetros
    // No React Native, o ideal é passar os dados iniciais via Params
    navigation.navigate("ImpostorGame", { config });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.mainContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* SEÇÃO JOGADORES */}
          <View style={styles.section}>
            <CustomText variant="label" style={styles.cyanText}>
              {t("games.impostor_lobby_matesID")} ({players.length})
            </CustomText>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder={t("games.impostor_lobby_playerName")}
                placeholderTextColor={COLORS.textSecondary}
                value={name}
                onChangeText={setName}
                maxLength={15}
                returnKeyType="done"
                onSubmitEditing={handleAddPlayer}
                submitBehavior="submit"
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddPlayer}>
                <CustomText variant="h2" style={{ color: "#FFF" }}>
                  +
                </CustomText>
              </TouchableOpacity>
            </View>

            {/* LISTA DE JOGADORES */}

            <View style={styles.playerList}>
              {players.map((p) => (
                <View
                  key={p.id}
                  style={[
                    styles.playerCard,
                    { width: isLargeScreen ? "48.5%" : "100%" } // 🔥 2 colunas se for tela larga
                  ]}
                >
                  <TouchableOpacity
                    style={styles.emojiCircle}
                    onPress={() => handleChangeEmoji(p.id)}
                  >
                    <CustomText style={{ fontSize: 34 }}>
                      {p.emoji || "👤"}
                    </CustomText>
                    <View style={styles.editIconBadge}>
                      <MaterialCommunityIcons
                        name="reload"
                        size={11}
                        color={COLORS.cyan}
                      />
                    </View>
                  </TouchableOpacity>

                  <CustomText variant="h3" style={styles.playerName}>
                    {p.name}
                  </CustomText>

                  <TouchableOpacity
                    onPress={() => removePlayer(p.id)}
                    style={styles.removeBtn}
                  >
                    <CustomText style={styles.removeText}>
                      {t("games.impostor_lobby_removeBtn")}
                    </CustomText>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* SEÇÃO: PARÂMETROS DA MISSÃO */}
          <View style={styles.section}>
            <CustomText variant="label" style={styles.cyanText}>
              {t("games.impostor_lobby_settingsTitle")}
            </CustomText>

            {/* CONTADOR DE IMPOSTORES */}
            <View style={styles.settingCard}>
              <View>
                <CustomText variant="h3">
                  {t("games.impostor_lobby_numberOfImpostors")}
                </CustomText>
                <CustomText variant="hint">
                  {t("games.impostor_lobby_impostorsLimit")}
                  {maxImpostors}
                </CustomText>
              </View>
              <View style={styles.counter}>
                <TouchableOpacity
                  onPress={() =>
                    setImpostorCount(Math.max(1, impostorCount - 1))
                  }
                  style={[
                    styles.cBtn,
                    impostorCount === 1 && styles.btnDisabled
                  ]}
                  disabled={impostorCount === 1}
                >
                  <CustomText variant="h2" style={{ color: "#FFF" }}>
                    -
                  </CustomText>
                </TouchableOpacity>
                <CustomText variant="h2" style={styles.cValue}>
                  {impostorCount}
                </CustomText>
                <TouchableOpacity
                  onPress={() =>
                    setImpostorCount(Math.min(maxImpostors, impostorCount + 1))
                  }
                  style={[
                    styles.cBtn,
                    impostorCount >= maxImpostors && styles.btnDisabled
                  ]}
                  disabled={impostorCount >= maxImpostors}
                >
                  <CustomText variant="h2" style={{ color: "#FFF" }}>
                    +
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>

            {/* SWITCHES TÁTICOS */}
            {[
              {
                label: t("games.impostor_lobby_twoWords"),
                sub: t("games.impostor_lobby_twoWordsSub"),
                val: twoWords,
                set: setTwoWords,
                desable: false
              },
              {
                label: t("games.impostor_lobby_whoStart"),
                sub: t("games.impostor_lobby_whoStartSub"),
                val: whoStarts,
                set: setWhoStarts,
                desable: false
              },
              {
                label: t("games.impostor_lobby_impostorStarts"),
                sub: t("games.impostor_lobby_impostorStartsSub"),
                val: impostorCanStart,
                set: setImpostorCanStart,
                desable: !whoStarts
              },
              {
                label: t("games.impostor_lobby_impostorHint"),
                sub: t("games.impostor_lobby_impostorHintSub"),
                val: hasHint,
                set: setHasHint,
                desable: false
              }
            ].map((item, index) => (
              <View key={index} style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <CustomText variant="h3" style={{ fontSize: 16 }}>
                    {item.label}
                  </CustomText>
                  <CustomText variant="hint" style={{ fontSize: 11 }}>
                    {item.sub}
                  </CustomText>
                </View>
                <Switch
                  value={item.val}
                  onValueChange={item.set}
                  trackColor={{
                    false: COLORS.surfaceLight,
                    true: COLORS.danger
                  }}
                  thumbColor={item.val ? COLORS.white : COLORS.textSecondary}
                  disabled={item.desable}
                />
              </View>
            ))}
          </View>

          {/* SEÇÃO: CATEGORIAS (BANCO DE DADOS) */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.categoryToggle,
                showCategories && styles.categoryToggleActive
              ]}
              onPress={() => setShowCategories(!showCategories)}
            >
              <CustomText
                variant="label"
                style={{ color: showCategories ? COLORS.black : COLORS.cyan }}
              >
                {showCategories
                  ? t("games.impostor_lobby_DBClose") + " ⇡"
                  : t("games.impostor_lobby_DBSelect") + " ⇣"}
              </CustomText>
            </TouchableOpacity>

            {showCategories && (
              <View style={styles.categoryGrid}>
                {ALL_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        isSelected && styles.activeChip
                      ]}
                      onPress={() => toggleCategory(cat)}
                    >
                      <CustomText
                        style={[
                          styles.categoryText,
                          isSelected && styles.activeCategoryText
                        ]}
                      >
                        {cat}
                      </CustomText>
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
            style={[
              styles.startBtn,
              players.length < 3 && styles.startBtnDisabled
            ]}
            disabled={players.length < 3}
            activeOpacity={0.8}
            onPress={handleStartMission}
          >
            <CustomText variant="h2" style={styles.startBtnText}>
              {t("games.impostor_lobby_startMission")}
            </CustomText>
            {players.length < 3 && (
              <CustomText
                variant="hint"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {t("games.impostor_lobby_startMinimum")}
              </CustomText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, marginTop: 15 },
  scrollContent: { padding: 15, paddingTop: 10, paddingBottom: 150 },
  section: { marginBottom: 35, gap: 15 },
  cyanText: { color: COLORS.cyan, marginBottom: 15 },

  inputGroup: { flexDirection: "row", gap: 10 },
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
  addBtn: {
    backgroundColor: COLORS.danger,
    width: 60,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center"
  },

  playerList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    justifyContent: "space-between"
  },

  playerTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)"
  },
  playerName: { flex: 1, marginLeft: 15, color: "#FFF" },
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,0,60,0.1)"
  },
  removeText: { color: COLORS.danger, fontSize: 10, fontWeight: "bold" },

  // Player Cards
  playerCard: {
    width: "100%",
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
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)"
  },

  counter: { flexDirection: "row", alignItems: "center", gap: 15 },
  cBtn: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  cValue: { minWidth: 30, textAlign: "center", color: COLORS.danger },
  btnDisabled: { opacity: 0.2 },

  //Categories styles

  categoryToggle: {
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.cyan,
    alignItems: "center"
  },
  categoryToggleActive: {
    backgroundColor: COLORS.cyan
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 15
  },
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
  categoryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "800"
  },
  activeCategoryText: { color: COLORS.background, fontWeight: "bold" },

  // Footer Style
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
    backgroundColor: COLORS.danger,
    padding: 22,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.danger,
    shadowRadius: 20,
    shadowOpacity: 0.6,
    elevation: 15
  },
  startBtnDisabled: {
    backgroundColor: COLORS.textSecondary,
    shadowOpacity: 0,
    elevation: 0
  },
  startBtnText: { color: "#FFF", letterSpacing: 2 }
});
