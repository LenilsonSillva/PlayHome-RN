import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { categories as ALL_CATEGORIES } from "@/games/common/data/words";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useOnlineImpostorLobby } from "@/games/impostor/hooks/useOnlineImpostorLobby";
import { useNavigation } from "@react-navigation/native";
import { useAlert } from "@/contexts/alertContext";

export const LobbyOnline = () => {
  const { state, actions } = useOnlineImpostorLobby();
  const [isCreating, setIsCreating] = useState(true);
  const [showCats, setShowCats] = useState(false);
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
      showAlert("Alerta!", error as string);
    }
  };

  // --- TELA DE ACESSO (FORA DA SALA) ---
  if (!state.inRoom) {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segBtn, isCreating && styles.activeSeg]}
            onPress={() => setIsCreating(true)}
          >
            <CustomText
              style={[styles.segText, isCreating && { color: COLORS.cyan }]}
            >
              CRIAR ESTAÇÃO
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segBtn, !isCreating && styles.activeSeg]}
            onPress={() => setIsCreating(false)}
          >
            <CustomText
              style={[styles.segText, !isCreating && { color: COLORS.cyan }]}
            >
              CONECTAR
            </CustomText>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <CustomText variant="label" style={styles.cyanLabel}>
            IDENTIFICAÇÃO
          </CustomText>
          <TextInput
            style={styles.input}
            placeholder="Seu Nome"
            placeholderTextColor={COLORS.textSecondary}
            value={state.name}
            onChangeText={actions.setName}
            maxLength={15}
          />

          {!isCreating && (
            <>
              <TextInput
                style={[styles.input, { marginTop: 15 }]}
                placeholder="Código de Acesso"
                placeholderTextColor={COLORS.textSecondary}
                value={state.roomCode}
                onChangeText={actions.setRoomCode}
                autoCapitalize="characters"
                maxLength={5}
              />

              {/* EXIBIÇÃO DA ÚLTIMA SALA (Apenas se existir no estado) */}
              {state.lastRoomCode && (
                <TouchableOpacity
                  style={styles.lastRoomBadge}
                  onPress={() => actions.setRoomCode(state.lastRoomCode!)}
                >
                  <MaterialCommunityIcons
                    name="history"
                    size={14}
                    color={COLORS.cyan}
                  />
                  <CustomText variant="hint" style={styles.lastRoomText}>
                    USAR ÚLTIMO CÓDIGO: {state.lastRoomCode}
                  </CustomText>
                </TouchableOpacity>
              )}
            </>
          )}

          <TouchableOpacity
            style={styles.mainBtn}
            onPress={() =>
              isCreating
                ? handleWaitAction("createRoom")
                : handleWaitAction("joinRoom")
            }
          >
            <CustomText variant="h3" style={{ color: COLORS.background }}>
              {isWaiting ? (
                <ActivityIndicator color="#000" size="small" />
              ) : isCreating ? (
                "GERAR CÓDIGO"
              ) : (
                "ESTABELECER CONEXÃO"
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER DA SALA COM BOTÃO SAIR/DESFAZER */}
        <View style={styles.roomHeader}>
          <View>
            <CustomText variant="label">ID DA ESTAÇÃO</CustomText>
            <CustomText variant="h1" style={styles.roomCodeDisplay}>
              {state.roomCode}
            </CustomText>
          </View>

          <TouchableOpacity style={styles.leaveBtn} onPress={actions.leaveRoom}>
            <MaterialCommunityIcons
              name="power"
              size={28}
              color={COLORS.danger}
            />
            <CustomText style={styles.leaveText}>ENCERRAR</CustomText>
          </TouchableOpacity>
        </View>

        {/* LISTA DE TRIPULANTES */}
        <View style={styles.section}>
          <CustomText variant="label" style={styles.cyanLabel}>
            TRIPULANTES ATIVOS ({state.players.length})
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
                  {p.name} {p.socketId === state.mySocketId ? "(VOCÊ)" : ""}
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
              CONFIGURAÇÕES DO LÍDER
            </CustomText>

            <View style={styles.counterCard}>
              <View>
                <CustomText variant="h3">Impostores</CustomText>
                <CustomText variant="hint">
                  Limite: {state.maxImpostors}
                </CustomText>
              </View>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  onPress={() =>
                    actions.setSelectImpostorNumbers(
                      Math.max(1, state.selectImpostorNumbers - 1)
                    )
                  }
                  style={styles.cBtn}
                >
                  <CustomText variant="h2" style={{ color: "#FFF" }}>
                    -
                  </CustomText>
                </TouchableOpacity>
                <CustomText variant="h2" style={styles.cValue}>
                  {state.selectImpostorNumbers}
                </CustomText>
                <TouchableOpacity
                  onPress={() =>
                    actions.setSelectImpostorNumbers(
                      Math.min(
                        state.maxImpostors,
                        state.selectImpostorNumbers + 1
                      )
                    )
                  }
                  style={styles.cBtn}
                >
                  <CustomText variant="h2" style={{ color: "#FFF" }}>
                    +
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.switchesGrid}>
              {[
                {
                  label: "Duas Palavras",
                  val: state.twoGroups,
                  set: actions.setTwoGroups
                },
                {
                  label: "Sorteio Início",
                  val: state.whoStart,
                  set: actions.setWhoStart
                },
                {
                  label: "Impostor Inicia",
                  val: state.impostorCanStart,
                  set: actions.setImpostorCanStart,
                  dis: !state.whoStart
                },
                {
                  label: "Dica p/ Impostor",
                  val: state.impostorHint,
                  set: actions.setImpostorHint
                }
              ].map((item, i) => (
                <View
                  key={i}
                  style={[styles.switchBox, item.dis && { opacity: 0.3 }]}
                >
                  <CustomText style={styles.switchLabel}>
                    {item.label}
                  </CustomText>
                  <Switch
                    value={item.val}
                    onValueChange={item.set}
                    disabled={item.dis}
                    trackColor={{
                      false: COLORS.surfaceLight,
                      true: COLORS.danger
                    }}
                    thumbColor={item.val ? COLORS.white : COLORS.textSecondary}
                  />
                </View>
              ))}
            </View>

            {/* ABA DE CATEGORIAS */}
            <TouchableOpacity
              style={[
                styles.categoryToggle,
                showCats && styles.categoryToggleActive
              ]}
              onPress={() => setShowCats(!showCats)}
            >
              <CustomText
                variant="label"
                style={{ color: showCats ? COLORS.background : COLORS.cyan }}
              >
                {showCats ? "FECHAR BANCO DE DADOS" : "CATEGORIAS DE PALAVRAS"}{" "}
                {showCats ? "⇡" : "⇣"}
              </CustomText>
            </TouchableOpacity>

            {showCats && (
              <View style={styles.catGrid}>
                {ALL_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catChip,
                      state.selectedCategories.includes(cat) && styles.catActive
                    ]}
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
            <CustomText style={styles.waitingText}>
              AGUARDANDO O COMANDANTE INICIAR...
            </CustomText>
          </View>
        )}
      </ScrollView>

      {state.isHost && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.startBtn,
              state.players.length < 3 && { opacity: 0.5 }
            ]}
            disabled={state.players.length < 3 || isWaiting}
            onPress={() => handleWaitAction("startGame")}
          >
            {isWaiting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <CustomText variant="h2" style={{ color: COLORS.white }}>
                INICIAR MISSÃO
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15
  },
  counterRow: { flexDirection: "row", alignItems: "center", gap: 15 },
  cBtn: {
    width: 38,
    height: 38,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  cValue: {
    color: COLORS.danger,
    fontWeight: "bold",
    fontSize: 22,
    minWidth: 25,
    textAlign: "center"
  },

  switchesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  switchBox: {
    width: "48.5%",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  switchLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "bold"
  },

  categoryToggle: {
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cyan,
    alignItems: "center",
    marginTop: 15
  },
  categoryToggleActive: { backgroundColor: COLORS.cyan },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 15,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12
  },
  catChip: {
    width: "48.5%",
    padding: 15,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center"
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
    borderRadius: 16,
    alignItems: "center",
    elevation: 10,
    shadowColor: COLORS.danger,
    shadowOpacity: 0.5,
    shadowRadius: 10
  }
});
