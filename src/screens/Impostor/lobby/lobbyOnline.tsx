import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, ActivityIndicator } from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { categories as ALL_CATEGORIES } from "@/games/common/data/words";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useOnlineImpostorLobby } from "@/games/impostor/hooks/useOnlineImpostorLobby";
import { useNavigation } from "@react-navigation/native";
import { useAlert } from "@/contexts/alertContext";
import { useTranslation } from "react-i18next";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

export const LobbyOnline = () => {
  const { t } = useTranslation();
  const { state, actions } = useOnlineImpostorLobby();
  const [isCreating, setIsCreating] = useState(true);
  const [showCats, setShowCats] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const navigation = useNavigation<any>();
  const [isWaiting, setIsWaiting] = useState(false);
  const { showAlert } = useAlert();

  // 🔥 1. Mudou a aba? Desliga o loading na hora!
  useEffect(() => {
    setIsWaiting(false);
  }, [isCreating, state.inRoom]);

  const handleWaitAction = async (action: string) => {
    setIsWaiting(true);

    try {
      if (action === "startGame")
        await actions.startGame().finally(() => {
          setIsWaiting(false);
        });
      if (action === "createRoom") await actions.handleCreate();
      if (action === "joinRoom") await actions.handleJoin();
      // Se der certo, a tela vai mudar sozinha, não precisa setIsWaiting(false)
    } catch (error) {
      // Se a sala não existir, ele para a bolinha e avisa o jogador!
      setIsWaiting(false);
      showAlert(t("alerts.alert"), error as string);
    }
  };

  const tacticalOptions = [
    {
      id: "twoWords",
      label: t("games.impostor_lobby_twoWords"),
      sub: t("games.impostor_lobby_twoWordsSub"),
      val: state.twoGroups,
      set: () => actions.setTwoGroups(!state.twoGroups),
      icon: "people-pulling",
      disable: false,
      show: true
    },
    {
      id: "whoStarts",
      label: t("games.impostor_lobby_whoStart"),
      sub: t("games.impostor_lobby_whoStartSub"),
      val: state.whoStart,
      set: () => actions.setWhoStart(!state.whoStart),
      icon: "dice",
      disable: false,
      show: true
    },
    {
      id: "impostorStarts",
      label: t("games.impostor_lobby_impostorStarts"),
      sub: t("games.impostor_lobby_impostorStartsSub"),
      val: state.impostorCanStart,
      set: () => actions.setImpostorCanStart(!state.impostorCanStart),
      icon: "masks-theater",
      disable: !state.whoStart,
      show: state.whoStart
    },
    {
      id: "impostorsUnited",
      label: t("Impostores Unidos"),
      sub: t("Impostores se conhecem no início."),
      val: state.impostorsUnited,
      set: () => actions.setImpostorsUnited(!state.impostorsUnited),
      icon: "users-viewfinder",
      disable: state.selectImpostorNumbers <= 1,
      show: state.selectImpostorNumbers > 1
    },
    {
      id: "hasHint",
      label: t("games.impostor_lobby_impostorHint"),
      sub: t("games.impostor_lobby_impostorHintSub"),
      val: state.impostorHint,
      set: () => actions.setImpostorHint(!state.impostorHint),
      icon: "lightbulb",
      disable: false,
      show: true
    },
    {
      id: "impostorCat",
      label: t("games.impostor_lobby_impostorCat"),
      sub: t("games.impostor_lobby_impostorCatSub"),
      val: state.impostorCat,
      set: () => actions.setImpostorCat(!state.impostorCat),
      icon: "spell-check",
      disable: !state.impostorHint,
      show: state.impostorHint
    },
    {
      id: "impostorTrap",
      label: t("games.impostor_lobby_impostorTrap"),
      sub: t("games.impostor_lobby_impostorTrapSub"),
      val: state.impostorTrap,
      set: () => actions.setImpostorTrap(!state.impostorTrap),
      icon: "skull",
      disable: !state.impostorHint,
      show: state.impostorHint
    }
  ];

  // --- TELA DE ACESSO (FORA DA SALA) ---
  if (!state.inRoom) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity style={[styles.segBtn, isCreating && styles.activeSeg]} onPress={() => setIsCreating(true)}>
            <CustomText style={[styles.segText, isCreating && { color: COLORS.cyan }]}>
              {t("games.impostor_lobby_createRoom")}
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segBtn, !isCreating && styles.activeSeg]} onPress={() => setIsCreating(false)}>
            <CustomText style={[styles.segText, !isCreating && { color: COLORS.cyan }]}>
              {t("games.impostor_lobby_joinRoom")}
            </CustomText>
          </TouchableOpacity>
        </View>

        {/* --- BANNER DE INFORMAÇÃO MULTIPLAYER --- */}
        <View style={styles.infoBanner}>
          <View style={styles.infoIconWrapper}>
            <MaterialCommunityIcons name="cellphone-link" size={26} color={COLORS.cyan} />
          </View>
          <View style={styles.infoTextContainer}>
            <CustomText variant="h3" style={styles.infoTitle}>
              {t("games.impostor_lobby_explainTitle")}
            </CustomText>
            <CustomText variant="label" style={styles.infoSubtitle}>
              {isCreating ? t("games.impostor_lobby_explainCreateRoom") : t("games.impostor_lobby_explainJoinRoom")}
            </CustomText>
          </View>
        </View>

        <View style={styles.section}>
          <CustomText variant="label" style={styles.cyanLabel}>
            {t("games.impostor_lobby_myID")}
          </CustomText>
          <TextInput
            style={styles.input}
            placeholder={t("games.impostor_lobby_playerName")}
            placeholderTextColor={COLORS.textSecondary}
            value={state.name}
            onChangeText={actions.setName}
            maxLength={15}
            returnKeyType="done"
            submitBehavior="submit"
          />

          {!isCreating && (
            <>
              <TextInput
                style={[styles.input, { marginTop: 15 }]}
                placeholder={t("games.impostor_lobby_accessCode")}
                placeholderTextColor={COLORS.textSecondary}
                value={state.roomCode}
                onChangeText={actions.setRoomCode}
                autoCapitalize="characters"
                maxLength={5}
              />

              {/* EXIBIÇÃO DA ÚLTIMA SALA (Apenas se existir no estado) */}
              {state.lastRoomCode && (
                <TouchableOpacity style={styles.lastRoomBadge} onPress={() => actions.setRoomCode(state.lastRoomCode!)}>
                  <MaterialCommunityIcons name="history" size={14} color={COLORS.cyan} />
                  <CustomText variant="hint" style={styles.lastRoomText}>
                    {t("games.impostor_lobby_lastRoom")} {state.lastRoomCode}
                  </CustomText>
                </TouchableOpacity>
              )}
            </>
          )}

          <TouchableOpacity
            style={styles.mainBtn}
            onPress={() => (isCreating ? handleWaitAction("createRoom") : handleWaitAction("joinRoom"))}
          >
            <CustomText variant="h3" style={{ color: COLORS.background }}>
              {isWaiting ? (
                <ActivityIndicator color="#000" size="small" />
              ) : isCreating ? (
                t("games.impostor_lobby_codeGenerate")
              ) : (
                t("games.impostor_lobby_connectRoom")
              )}
            </CustomText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // --- SALA DE ESPERA (DENTRO DA SALA) ---
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HEADER DA SALA COM BOTÃO SAIR/DESFAZER */}
        <View style={styles.roomHeader}>
          <View>
            <CustomText variant="label">{t("games.impostor_lobby_roomCode")}</CustomText>
            <CustomText variant="h1" style={styles.roomCodeDisplay}>
              {state.roomCode}
            </CustomText>
          </View>

          <TouchableOpacity style={styles.leaveBtn} onPress={actions.leaveRoom}>
            <MaterialCommunityIcons name="power" size={28} color={COLORS.danger} />
            <CustomText style={styles.leaveText}>{t("games.impostor_lobby_leaveRoom")}</CustomText>
          </TouchableOpacity>
        </View>

        {/* LISTA DE TRIPULANTES */}
        <View style={styles.section}>
          <CustomText variant="label" style={styles.cyanLabel}>
            {t("games.impostor_lobby_playersConnected")} ({state.players.length})
          </CustomText>
          <View style={styles.playersList}>
            {state.players.map((p) => (
              <View key={p.socketId} style={styles.playerCard}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: p.isHost ? COLORS.danger : COLORS.success
                    }
                  ]}
                />
                <CustomText variant="h3" style={styles.playerName}>
                  {p.name} {p.socketId === state.mySocketId ? t("games.impostor_lobby_you") : ""}
                </CustomText>
                {p.isHost && (
                  <View style={styles.hostBadge}>
                    <CustomText style={styles.hostBadgeText}>HOST</CustomText>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* CONFIGURAÇÕES (APENAS PARA O HOST) */}
        {state.isHost ? (
          <View style={styles.section}>
            <CustomText variant="label" style={styles.cyanLabel}>
              {t("games.impostor_lobby_settingsTitle")}
            </CustomText>

            <View style={styles.counterCard}>
              <View>
                <CustomText variant="h3">{t("games.impostor_lobby_numberOfImpostors")}</CustomText>
                <CustomText variant="hint">
                  {t("games.impostor_lobby_impostorsLimit")}
                  {state.maxImpostors}
                </CustomText>
              </View>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  onPress={() => actions.setSelectImpostorNumbers(Math.max(1, state.selectImpostorNumbers - 1))}
                  style={[styles.cBtn, state.selectImpostorNumbers === 1 && styles.btnDisabled]}
                  disabled={state.selectImpostorNumbers === 1}
                >
                  <CustomText variant="h2" style={{ color: "#FFF" }}>
                    -
                  </CustomText>
                </TouchableOpacity>
                <CustomText variant="h2" style={styles.cValue}>
                  {state.selectImpostorNumbers}
                </CustomText>
                <TouchableOpacity
                  onPress={() => actions.setSelectImpostorNumbers(Math.min(state.maxImpostors, state.selectImpostorNumbers + 1))}
                  style={[styles.cBtn, state.selectImpostorNumbers >= state.maxImpostors && styles.btnDisabled]}
                  disabled={state.selectImpostorNumbers >= state.maxImpostors}
                >
                  <CustomText variant="h2" style={{ color: "#FFF" }}>
                    +
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>

            {/* OPTIONS SWITCH */}
            <TouchableOpacity
              style={[styles.categoryToggle, showOptions && styles.categoryToggleActive]}
              onPress={() => setShowOptions(!showOptions)}
            >
              <CustomText variant="label" style={{ color: showOptions ? COLORS.black : COLORS.cyan }}>
                {showOptions ? t("games.impostor_lobby_gameOptClose") + " ⇡" : t("games.impostor_lobby_gameOpt") + " ⇣"}
              </CustomText>
            </TouchableOpacity>

            {showOptions && (
              <View style={styles.optionsGrid}>
                {tacticalOptions.map((item) => {
                  if (!item.show) return null;
                  return (
                    <View key={item.id} style={[styles.optionWrapper, item.disable && { opacity: 0.3 }]}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        disabled={item.disable}
                        onPress={item.set}
                        style={[styles.optionSquare, item.val && styles.optionSquareActive]}
                      >
                        <FontAwesome6 name={item.icon as any} size={32} color={item.val ? COLORS.black : COLORS.cyan} />
                        <CustomText variant="label" style={[styles.optionTitle, { color: item.val ? COLORS.black : "#FFF" }]}>
                          {item.label}
                        </CustomText>
                      </TouchableOpacity>
                      <CustomText variant="hint" style={styles.optionDescription}>
                        {item.sub}
                      </CustomText>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ABA DE CATEGORIAS */}
            <TouchableOpacity
              style={[styles.categoryToggle, showCats && styles.categoryToggleActive]}
              onPress={() => setShowCats(!showCats)}
            >
              <CustomText variant="label" style={{ color: showCats ? COLORS.background : COLORS.cyan }}>
                {showCats ? t("games.impostor_lobby_DBClose") : t("games.impostor_lobby_DBSelect")} {showCats ? "⇡" : "⇣"}
              </CustomText>
            </TouchableOpacity>

            {showCats && (
              <View style={styles.catGrid}>
                {ALL_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, state.selectedCategories.includes(cat) && styles.catActive]}
                    onPress={() => {
                      const next = state.selectedCategories.includes(cat)
                        ? state.selectedCategories.filter((c) => c !== cat)
                        : [...state.selectedCategories, cat];
                      actions.setSelectedCategories(next);
                    }}
                  >
                    <CustomText
                      style={[
                        styles.catText,
                        state.selectedCategories.includes(cat) && {
                          color: COLORS.background
                        }
                      ]}
                    >
                      {cat}
                    </CustomText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.waitingBox}>
            <ActivityIndicator color={COLORS.cyan} size="large" />
            <CustomText style={styles.waitingText}>{t("games.impostor_lobby_waitingInit")}</CustomText>
          </View>
        )}
      </ScrollView>

      {state.isHost && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.startBtn, state.players.length < 3 && styles.startBtnDisabled]}
            disabled={state.players.length < 3 || isWaiting}
            onPress={() => handleWaitAction("startGame")}
          >
            {isWaiting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : state.players.length < 3 ? (
              <View style={{ alignItems: "center" }}>
                <CustomText variant="h2" style={styles.startBtnText}>
                  {t("games.impostor_lobby_startMission")}
                </CustomText>
                <CustomText variant="hint" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {t("games.impostor_lobby_startMinimum")}
                </CustomText>
              </View>
            ) : (
              <CustomText variant="h2" style={styles.startBtnText}>
                {t("games.impostor_lobby_startMission")}
              </CustomText>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingBottom: 150 },
  section: { marginBottom: 30 },
  cyanLabel: {
    color: COLORS.cyan,
    letterSpacing: 2,
    marginBottom: 15,
    fontWeight: "800"
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 25
  },
  segBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10
  },
  btnDisabled: { opacity: 0.2 },
  activeSeg: { backgroundColor: COLORS.surfaceLight },
  segText: { fontSize: 12, fontWeight: "bold", color: COLORS.textSecondary },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 18,
    color: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    fontSize: 16
  },

  lastRoomBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    gap: 8,
    backgroundColor: "rgba(0, 242, 255, 0.05)",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 242, 255, 0.1)"
  },
  lastRoomText: { color: COLORS.cyan, fontWeight: "bold" },

  mainBtn: {
    backgroundColor: COLORS.cyan,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 25
  },

  // --- Estilos do Banner Multiplayer ---
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 242, 255, 0.05)", // Fundo ciano bem transparente
    borderWidth: 1,
    borderColor: "rgba(0, 242, 255, 0.3)",
    borderStyle: "dashed", // Dá aquele ar de tecnologia/interface
    borderRadius: 16,
    padding: 16,
    marginBottom: 25
  },
  infoIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "rgba(0, 242, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15
  },
  infoTextContainer: {
    flex: 1
  },
  infoTitle: {
    color: COLORS.cyan,
    letterSpacing: 1,
    marginBottom: 4
  },
  infoSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16
  },

  roomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 24,
    marginBottom: 30,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: COLORS.cyan
  },
  roomCodeDisplay: {
    fontSize: 42,
    color: "#FFF",
    fontWeight: "900",
    letterSpacing: 5
  },
  leaveBtn: { alignItems: "center", gap: 4 },
  leaveText: { fontSize: 9, color: COLORS.danger, fontWeight: "900" },

  playersList: { gap: 10 },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 15,
    borderRadius: 12
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 15 },
  playerName: { flex: 1, color: "#FFF", fontWeight: "bold" },
  hostBadge: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  hostBadgeText: { fontSize: 9, fontWeight: "bold", color: "#FFF" },

  counterCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  counterRow: { flexDirection: "row", alignItems: "center", gap: 15 },
  cBtn: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  cValue: { minWidth: 30, textAlign: "center", color: COLORS.danger },

  switchesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  switchBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)"
  },
  switchLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "bold"
  },

  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 15
  },
  optionWrapper: {
    width: "48%",
    marginBottom: 20,
    alignItems: "center"
  },
  optionSquare: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 242, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    marginBottom: 8
  },
  optionSquareActive: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.white,
    elevation: 10
  },
  optionTitle: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase"
  },
  optionDescription: {
    textAlign: "center",
    fontSize: 11,
    lineHeight: 12,
    color: COLORS.textSecondary,
    paddingHorizontal: 5
  },

  categoryToggle: {
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cyan,
    alignItems: "center",
    marginBottom: 20
  },
  categoryToggleActive: { backgroundColor: COLORS.cyan },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 15
  },
  catChip: {
    width: "48.5%",
    padding: 18,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  catActive: { backgroundColor: COLORS.cyan },
  catText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "bold" },

  waitingBox: { alignItems: "center", marginTop: 40, gap: 15 },
  waitingText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center"
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
