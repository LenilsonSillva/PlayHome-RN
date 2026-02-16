import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { usePlayers } from "@/contexts/contextHook";
import { getImpostorCount } from "@/games/impostor/logic/initializeGame";
import { categories as ALL_CATEGORIES } from "@/games/common/data/words"; // Importando do seu caminho
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "App";

export const LobbyOffline = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { players, addPlayer, removePlayer } = usePlayers();

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

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleAddPlayer = () => {
    if (name.trim()) {
      addPlayer(name);
      setName("");
    }
  };

    const handleStartMission = () => {
    // 1. Preparamos o objeto de configuração
    const config = {
      impostorCount,
      twoWordsMode: twoWords,
      impostorHasHint: hasHint,
      selectedCategories,
      whoStartButton: whoStarts,
      impostorCanStart,
    };

    // 2. Navegamos para a tela da Partida passando os parâmetros
    // No React Native, o ideal é passar os dados iniciais via Params
    navigation.navigate('ImpostorGame', { config });
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
          {/* SEÇÃO: ADICIONAR TRIPULANTES */}
          <View style={styles.section}>
            <CustomText variant="label" style={styles.cyanText}>
              EQUIPE DE CAMPO ({players.length}/20)
            </CustomText>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Identificação do Tripulante"
                placeholderTextColor={COLORS.textSecondary}
                value={name}
                onChangeText={setName}
                maxLength={15}
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddPlayer}>
                <CustomText variant="h2" style={{ color: "#FFF" }}>
                  +
                </CustomText>
              </TouchableOpacity>
            </View>

            <View style={styles.playerList}>
              {players.map((p) => (
                <View key={p.id} style={styles.playerTag}>
                  <CustomText style={styles.playerName}>{p.name}</CustomText>
                  <TouchableOpacity
                    onPress={() => removePlayer(p.id)}
                    style={styles.removeBtn}
                  >
                    <CustomText
                      style={{ color: COLORS.danger, fontWeight: "900" }}
                    >
                      ✕
                    </CustomText>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* SEÇÃO: PARÂMETROS DA MISSÃO */}
          <View style={styles.section}>
            <CustomText variant="label" style={styles.cyanText}>
              CONFIGURAÇÕES DE PROTOCOLO
            </CustomText>

            {/* CONTADOR DE IMPOSTORES */}
            <View style={styles.settingCard}>
              <View>
                <CustomText variant="h3">Qtd. de Impostores</CustomText>
                <CustomText variant="hint">
                  Limite atual: {maxImpostors}
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
                label: "Modo Duas Palavras",
                sub: "Divide os civis em 2 grupos",
                val: twoWords,
                set: setTwoWords
              },
              {
                label: "Sorteio de Início",
                sub: "Sistema define quem começa",
                val: whoStarts,
                set: setWhoStarts
              },
              {
                label: "Impostor pode Iniciar",
                sub: "Permite traidor começar",
                val: impostorCanStart,
                set: setImpostorCanStart
              },
              {
                label: "Impostor tem Dica",
                sub: "Exibe dica para o traidor",
                val: hasHint,
                set: setHasHint
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
                style={{ color: showCategories ? "#FFF" : COLORS.cyan }}
              >
                {showCategories
                  ? "FECHAR BANCO DE DADOS ⇡"
                  : "SELECIONAR CATEGORIAS ⇣"}
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
              INICIALIZAR MISSÃO
            </CustomText>
            {players.length < 3 && (
              <CustomText
                variant="hint"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                MÍNIMO DE 3 TRIPULANTES
              </CustomText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  scrollContent: { padding: 15, paddingTop: 10, paddingBottom: 150 },
  section: { marginBottom: 35, gap: 5 },
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
    marginTop: 15
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
  playerName: { fontSize: 16, color: "#FFF", fontWeight: "600" },
  removeBtn: { padding: 5 },

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
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cyan,
    backgroundColor: "rgba(0, 242, 255, 0.05)",
    alignItems: "center"
  },
  categoryToggleActive: { backgroundColor: COLORS.cyan },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 15,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 16
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)"
  },
  activeChip: { backgroundColor: COLORS.cyan, borderColor: "#FFF" },
  categoryText: { fontSize: 12, color: COLORS.textSecondary },
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
