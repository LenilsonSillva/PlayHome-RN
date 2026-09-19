import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  useWindowDimensions
} from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { useOnlineCryptographyLobby } from "@/games/cryptography/hooks/useOnlineCryptographyLobby";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAlert } from "@/contexts/alertContext";
import { useTranslation } from "react-i18next";
import { useAudio } from "@/contexts/audioContext";
import type { CryptoGroupView, CryptoLobbyPlayer, CryptoPresentPlayer } from "@/games/cryptography/types/online";

// ============================================================
// LOBBY ONLINE DO CRIPTOGRAFIA
// Mesmas propriedades visuais do LobbyOffline (seletor de modo,
// distribuição, nº de grupos, cronômetro, palavras/pulos, banco
// de dados) + salas, grupos com líder e jogadores presenciais.
// O servidor é a fonte da verdade (crypto:room-updated).
// ============================================================
export const LobbyOnline = () => {
  const { t } = useTranslation();
  const { playSound } = useAudio();
  const { state, actions } = useOnlineCryptographyLobby();
  const { showAlert } = useAlert();

  const [isWaiting, setIsWaiting] = useState(false); // loading criar/entrar/iniciar
  const [showCategories, setShowCategories] = useState(false);
  const [showFlags, setShowFlags] = useState(false);
  const [presentGroupId, setPresentGroupId] = useState<string | null>(null);
  const [presentName, setPresentName] = useState("");
  const [moveGroupId, setMoveGroupId] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 600;

  // Ao trocar de aba/sair da sala, desliga o loading
  useEffect(() => {
    setIsWaiting(false);
    setPresentGroupId(null);
    setMoveGroupId(null);
  }, [state.inRoom, state.isCreating, state.amWaitingToWatch]);

  const runAction = async (action: () => Promise<unknown>) => {
    setIsWaiting(true);
    try {
      await action();
    } catch (error) {
      showAlert(t("alerts.alert"), String(error));
    } finally {
      // 🔥 Libera o loading em TODOS os casos: no sucesso também
      // (antes o spinner ficava preso e o botão de INICIAR travava)
      setIsWaiting(false);
    }
  };

  const confirmAction = (message: string, onConfirm: () => void) => {
    showAlert(t("alerts.warning"), message, "⚠️", [
      { text: t("alerts.cancel"), style: "cancel" },
      { text: t("alerts.confirm"), style: "destructive", onPress: onConfirm }
    ]);
  };

  // ============================================================
  // FORA DA SALA — CRIAR / ENTRAR
  // ============================================================
  if (!state.inRoom) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.entrySegmented}>
          <TouchableOpacity
            style={[styles.entrySegBtn, state.isCreating && styles.entrySegActive]}
            onPress={() => {
              actions.setIsCreating(true);
              playSound("click2");
            }}
          >
            <CustomText style={[styles.entrySegText, state.isCreating && { color: COLORS.cyan }]}>
              {t("games.impostor_lobby_createRoom")}
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.entrySegBtn, !state.isCreating && styles.entrySegActive]}
            onPress={() => {
              actions.setIsCreating(false);
              playSound("click2");
            }}
          >
            <CustomText style={[styles.entrySegText, !state.isCreating && { color: COLORS.cyan }]}>
              {t("games.impostor_lobby_joinRoom")}
            </CustomText>
          </TouchableOpacity>
        </View>

        {/* Banner de informação multiplayer */}
        <View style={styles.infoBanner}>
          <View style={styles.infoIconWrapper}>
            <MaterialCommunityIcons name="cellphone-link" size={26} color={COLORS.cyan} />
          </View>
          <View style={styles.infoTextContainer}>
            <CustomText variant="h3" style={styles.infoTitle}>
              {t("games.impostor_lobby_explainTitle")}
            </CustomText>
            <CustomText variant="label" style={styles.infoSubtitle}>
              {state.isCreating ? t("games.impostor_lobby_explainCreateRoom") : t("games.impostor_lobby_explainJoinRoom")}
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

          {!state.isCreating && (
            <>
              <TextInput
                style={[styles.input, { marginTop: 15, textTransform: "uppercase" }]}
                placeholder={t("games.impostor_lobby_accessCode")}
                placeholderTextColor={COLORS.textSecondary}
                value={state.roomCode}
                onChangeText={actions.setRoomCode}
                autoCapitalize="characters"
                maxLength={5}
              />

              {state.lastRoomCode ? (
                <TouchableOpacity
                  style={styles.lastRoomBadge}
                  onPress={() => {
                    actions.setRoomCode(state.lastRoomCode!);
                    playSound("click2");
                  }}
                >
                  <MaterialCommunityIcons name="history" size={14} color={COLORS.cyan} />
                  <CustomText variant="hint" style={styles.lastRoomText}>
                    {t("games.impostor_lobby_lastRoom")} {state.lastRoomCode}
                  </CustomText>
                </TouchableOpacity>
              ) : null}
            </>
          )}

          <TouchableOpacity
            style={styles.entryMainBtn}
            onPress={() => {
              playSound("click2");
              runAction(state.isCreating ? actions.handleCreate : actions.handleJoin);
            }}
          >
            <CustomText variant="h3" style={{ color: COLORS.background }}>
              {isWaiting ? (
                <ActivityIndicator color="#000" size="small" />
              ) : state.isCreating ? (
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

  // ============================================================
  // ENTROU COM A PARTIDA ROLANDO — escolher grupo para assistir
  // ============================================================
  if (state.amWaitingToWatch && state.room) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.waitingWatchPanel}>
          <MaterialCommunityIcons name="eye" size={40} color={COLORS.cyan} />
          <CustomText variant="h2" style={styles.waitingWatchTitle}>
            {t("games.cryptography_online_lobby_waitingGroupTitle")}
          </CustomText>
          <CustomText variant="body" style={styles.waitingWatchSub}>
            {t("games.cryptography_online_lobby_waitingGroupSub")}
          </CustomText>
        </View>

        {state.room.groups.map((group: CryptoGroupView) => (
          <TouchableOpacity
            key={group.id}
            style={[styles.watchGroupCard, { borderColor: group.color }]}
            onPress={() => {
              playSound("click2");
              runAction(() => actions.chooseWaitingGroup(group.id));
            }}
          >
            <CustomText variant="h3" style={{ color: group.color }}>
              {group.name}
            </CustomText>
            <CustomText variant="label" style={{ color: COLORS.cyan }}>
              {t("games.cryptography_online_lobby_watch")} →
            </CustomText>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.ghostLeaveBtn}
          onPress={() => {
            actions.leaveRoom();
            playSound("click2");
          }}
        >
          <CustomText variant="label" style={{ color: COLORS.danger }}>
            {t("games.impostor_lobby_leaveRoom")}
          </CustomText>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ============================================================
  // DENTRO DA SALA (LOBBY)
  // ============================================================
  const room = state.room!;
  const groups = room.groups;
  const onlinePlayers = room.players;
  const presentPlayers = room.presentPlayers || [];
  const iLeadAGroup = groups.some((g) => g.subHostId === state.myPlayer?.id);

  const membersOf = (groupId: string) => {
    const online = onlinePlayers.filter((p) => p.groupId === groupId);
    const present = presentPlayers.filter((p) => p.groupId === groupId);
    return { online, present };
  };

  const movablePlayers = (groupId: string) => {
    const online = onlinePlayers.filter((p) => p.groupId !== groupId);
    const present = presentPlayers.filter((p) => p.groupId !== groupId);
    return { online, present };
  };

  const renderMemberChip = (player: CryptoLobbyPlayer | CryptoPresentPlayer, group: CryptoGroupView, isPresent: boolean) => {
    const isMe = "socketId" in player && player.socketId === state.mySocketId;
    const isLeader = group.subHostId === player.id;
    return (
      <View key={player.id} style={styles.memberChip}>
        <CustomText style={styles.memberEmoji}>{player.emoji || (isPresent ? "🏠" : "👤")}</CustomText>
        <CustomText variant="label" numberOfLines={1} style={styles.memberName}>
          {player.name}
          {isMe ? ` ${t("games.cryptography_online_lobby_you")}` : ""}
        </CustomText>

        {isLeader && (
          <View style={[styles.leaderBadge, { backgroundColor: group.color }]}>
            <MaterialCommunityIcons name="crown" size={12} color={COLORS.background} />
          </View>
        )}

        {/* Host pode definir o líder e expulsar online; subHost remove presencial do grupo */}
        {state.isHost && !isPresent && !isLeader && (
          <TouchableOpacity
            style={styles.chipIconBtn}
            onPress={() => {
              playSound("click2");
              runAction(() => actions.setSubHost(group.id, player.id));
            }}
          >
            <MaterialCommunityIcons name="crown-outline" size={16} color={COLORS.cyan} />
          </TouchableOpacity>
        )}

        {(state.isHost || (!isPresent ? false : actions.canManageGroup(group.id))) && !isMe && (
          <TouchableOpacity
            style={styles.chipIconBtn}
            onPress={() => {
              playSound("click2");
              const kick = () => runAction(() => actions.removePlayer(player.id));
              if (isPresent) {
                confirmAction(t("games.cryptography_online_lobby_kickConfirm"), kick);
              } else {
                confirmAction(t("games.cryptography_online_lobby_kickConfirm"), kick);
              }
            }}
          >
            <MaterialCommunityIcons name="close" size={16} color={COLORS.danger} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* CABEÇALHO DA SALA */}
        <View style={styles.roomHeader}>
          <View>
            <CustomText variant="label" style={{ color: COLORS.textSecondary }}>
              {t("games.impostor_lobby_roomCode")}
            </CustomText>
            <CustomText variant="h1" style={styles.roomCodeDisplay}>
              {state.roomCode}
            </CustomText>
            {state.isHost && (
              <View style={styles.hostBadge}>
                <CustomText style={styles.hostBadgeText}>👑 {t("games.cryptography_online_lobby_host")}</CustomText>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.leaveBtn}
            onPress={() => {
              playSound("click2");
              actions.leaveRoom();
            }}
          >
            <MaterialCommunityIcons name="power" size={28} color={COLORS.danger} />
            <CustomText style={styles.leaveText}>{t("games.impostor_lobby_leaveRoom")}</CustomText>
          </TouchableOpacity>
        </View>

        {/* ==================== ESQUADRÕES ==================== */}
        <View style={styles.section}>
          <CustomText variant="label" style={styles.cyanLabel}>
            {t("games.cryptography_online_lobby_groups")} ({groups.length})
          </CustomText>

          <TouchableOpacity
            style={[styles.createGroupBtn, !state.isHost && iLeadAGroup && styles.btnDisabled]}
            disabled={!state.isHost && iLeadAGroup}
            onPress={() => {
              playSound("click2");
              runAction(actions.createGroup);
            }}
          >
            <MaterialCommunityIcons name="account-group" size={20} color={COLORS.background} />
            <CustomText variant="h3" style={{ color: COLORS.background }}>
              {t("games.cryptography_online_lobby_createGroup")}
            </CustomText>
          </TouchableOpacity>

          {groups.length === 0 && (
            <CustomText variant="hint" style={styles.noGroupText}>
              {t("games.cryptography_online_lobby_noGroupYet")}
            </CustomText>
          )}

          {groups.map((group: CryptoGroupView) => {
            const { online, present } = membersOf(group.id);
            const movable = movablePlayers(group.id);
            const canManage = actions.canManageGroup(group.id);
            const isMine = state.myGroupId === group.id;

            return (
              <View key={group.id} style={[styles.groupCard, { borderLeftColor: group.color }]}>
                {/* Cabeçalho do grupo */}
                <View style={styles.groupHeader}>
                  <CustomText variant="h2" style={[styles.groupName, { color: group.color }]}>
                    {group.name}
                  </CustomText>
                  {canManage && (
                    <TouchableOpacity
                      style={styles.deleteGroupBtn}
                      onPress={() => {
                        playSound("click2");
                        confirmAction(t("games.cryptography_online_lobby_deleteGroupConfirm"), () =>
                          runAction(() => actions.deleteGroup(group.id))
                        );
                      }}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.danger} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Integrantes */}
                <View style={styles.membersRow}>
                  {online.map((p) => renderMemberChip(p, group, false))}
                  {present.map((p) => renderMemberChip(p, group, true))}
                  {online.length + present.length === 0 && (
                    <CustomText variant="hint" style={styles.noGroupText}>
                      {t("games.cryptography_online_lobby_presentHintEmpty")}
                    </CustomText>
                  )}
                </View>

                {/* Ações de quem pode gerenciar o grupo */}

                {canManage && (
                  <CustomText
                    variant="label"
                    style={{ textAlign: "center", marginTop: 20, marginBottom: 5, color: COLORS.textSecondary }}
                  >
                    {t("games.cryptography_online_lobby_addPlayer")}
                  </CustomText>
                )}

                {canManage && (
                  <View style={styles.groupActionsRow}>
                    <TouchableOpacity
                      style={styles.miniActionBtn}
                      onPress={() => {
                        playSound("click2");
                        setPresentGroupId(presentGroupId === group.id ? null : group.id);
                        setMoveGroupId(null);
                      }}
                    >
                      <MaterialCommunityIcons name="account-plus" size={15} color={COLORS.cyan} />
                      <CustomText style={styles.miniActionText}>{t("games.cryptography_online_lobby_addPresent")}</CustomText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.miniActionBtn}
                      onPress={() => {
                        playSound("click2");
                        setMoveGroupId(moveGroupId === group.id ? null : group.id);
                        setPresentGroupId(null);
                      }}
                    >
                      <MaterialCommunityIcons name="account-switch" size={15} color={COLORS.cyan} />
                      <CustomText style={styles.miniActionText}>{t("games.cryptography_online_lobby_movePlayers")}</CustomText>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Adicionar presencial */}
                {canManage && presentGroupId === group.id && (
                  <View style={styles.inlineForm}>
                    <TextInput
                      style={styles.inlineInput}
                      placeholder={t("games.cryptography_online_lobby_presentNamePlaceholder")}
                      placeholderTextColor={COLORS.textSecondary}
                      value={presentName}
                      onChangeText={setPresentName}
                      maxLength={15}
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        if (presentName.trim()) {
                          runAction(() => actions.addPresentPlayer(presentName.trim(), group.id));
                          setPresentName("");
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={styles.inlineAddBtn}
                      onPress={() => {
                        playSound("click2");
                        if (!presentName.trim()) return;
                        runAction(() => actions.addPresentPlayer(presentName.trim(), group.id));
                        setPresentName("");
                      }}
                    >
                      <CustomText variant="h3" style={{ color: COLORS.background }}>
                        +
                      </CustomText>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Mover jogadores para o grupo */}
                {canManage && moveGroupId === group.id && (
                  <View style={styles.moveArea}>
                    <CustomText variant="hint" style={styles.moveHint}>
                      {t("games.cryptography_online_lobby_moveHint")}
                    </CustomText>
                    <View style={styles.membersRow}>
                      {[...movable.online, ...movable.present].map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          style={styles.moveChip}
                          onPress={() => {
                            playSound("click2");
                            runAction(() => actions.assignToGroup(p.id, group.id));
                          }}
                        >
                          <CustomText style={styles.moveChipEmoji}>{p.emoji || ("socketId" in p ? "👤" : "🏠")}</CustomText>
                          <CustomText variant="hint" numberOfLines={1} style={styles.moveChipName}>
                            {p.name}
                          </CustomText>
                        </TouchableOpacity>
                      ))}
                      {movable.online.length + movable.present.length === 0 && (
                        <CustomText variant="hint" style={styles.noGroupText}>
                          {t("games.cryptography_online_lobby_noPlayerToMove")}
                        </CustomText>
                      )}
                    </View>
                  </View>
                )}

                {/* Entrar / sair do grupo */}
                {!canManage && (
                  <TouchableOpacity
                    style={[styles.joinGroupBtn, isMine && styles.leaveGroupBtn]}
                    onPress={() => {
                      playSound("click2");
                      runAction(isMine ? actions.leaveGroup : () => actions.joinGroup(group.id));
                    }}
                  >
                    <CustomText variant="label" style={{ color: isMine ? COLORS.danger : COLORS.cyan }}>
                      {isMine ? t("games.cryptography_online_lobby_leaveGroup") : t("games.cryptography_online_lobby_joinGroup")}
                    </CustomText>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* 🔥 NOVA LISTA DE JOGADORES (Igual a do Impostor) */}

        <View style={styles.sectionPlayers}>
          <CustomText variant="label">
            {t("games.cryptography_lobby_crewmates")} {t("games.impostor_lobby_online")} ({onlinePlayers.length})
          </CustomText>
          <View style={styles.playerList}>
            {onlinePlayers.map((p) => (
              <View key={p.id} style={[styles.playerCard, { width: isLargeScreen ? "48.5%" : "100%" }]}>
                <CustomText style={{ fontSize: 34 }}>{p.emoji || "👤"}</CustomText>
                <CustomText variant="label" numberOfLines={1} style={styles.playerName}>
                  {p.name}
                  {p.id === state.myPlayer?.id ? ` ${t("games.cryptography_online_lobby_you")}` : ""}
                </CustomText>

                <View style={styles.playerActions}>
                  {state.isHost && p.id !== state.myPlayer?.id && (
                    <TouchableOpacity
                      onPress={() => {
                        playSound("click2");
                        const kick = () => runAction(() => actions.removePlayer(p.id));
                        if (p.connection === "present") {
                          confirmAction(t("games.cryptography_online_lobby_kickConfirm"), kick);
                        } else {
                          confirmAction(t("games.cryptography_online_lobby_kickConfirm"), kick);
                        }
                      }}
                      style={styles.removeBtn}
                    >
                      <CustomText style={styles.removeText}>{t("games.cryptography_lobby_remove")}</CustomText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>

          {presentPlayers.length > 0 && (
            <CustomText variant="label">
              {t("games.cryptography_lobby_crewmates")} {t("games.impostor_lobby_local")} ({presentPlayers.length})
            </CustomText>
          )}
          <View style={styles.playerList}>
            {presentPlayers.map((p) => (
              <View key={p.id} style={[styles.playerCard, { width: isLargeScreen ? "48.5%" : "100%" }]}>
                <CustomText style={{ fontSize: 34 }}>{p.emoji || "👤"}</CustomText>
                <CustomText variant="label" numberOfLines={1} style={styles.playerName}>
                  {p.name}
                  {p.id === state.myPlayer?.id ? ` ${t("games.cryptography_online_lobby_you")}` : ""}
                </CustomText>

                <View style={styles.playerActions}>
                  {state.isHost && (
                    <TouchableOpacity
                      onPress={() => {
                        playSound("click2");
                        const kick = () => runAction(() => actions.removePlayer(p.id));
                        if (p.connection === "present") {
                          confirmAction(t("games.cryptography_online_lobby_kickConfirm"), kick);
                        } else {
                          confirmAction(t("games.cryptography_online_lobby_kickConfirm"), kick);
                        }
                      }}
                      style={styles.removeBtn}
                    >
                      <CustomText style={styles.removeText}>{t("games.cryptography_lobby_remove")}</CustomText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ==================== CONFIG (SÓ HOST) ==================== */}
        {state.isHost ? (
          <>
            {/* SELEÇÃO DE MODO */}
            <CustomText variant="label" style={styles.cyanLabel}>
              {t("games.cryptography_online_lobby_mode")}
            </CustomText>
            <View style={styles.modeSelector}>
              <TouchableOpacity
                style={[styles.modeBtn, state.mode === "infiltration" && styles.modeActive]}
                onPress={() => {
                  actions.updateConfig({ mode: "infiltration", roundTime: 60 });
                  playSound("click2");
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="run-fast"
                  size={24}
                  color={state.mode === "infiltration" ? COLORS.cyan : COLORS.textSecondary}
                />
                <CustomText variant="label" style={{ color: state.mode === "infiltration" ? COLORS.cyan : COLORS.textSecondary }}>
                  {t("games.cryptography_phase_infiltration_action")}
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeBtn, state.mode === "interception" && styles.modeActive]}
                onPress={() => {
                  actions.updateConfig({ mode: "interception", roundTime: 15 });
                  playSound("click2");
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="crosshairs-gps"
                  size={24}
                  color={state.mode === "interception" ? COLORS.danger : COLORS.textSecondary}
                />
                <CustomText
                  variant="label"
                  style={{ color: state.mode === "interception" ? COLORS.danger : COLORS.textSecondary }}
                >
                  {t("games.cryptography_phase_interception_action")}
                </CustomText>
              </TouchableOpacity>
            </View>

            <View style={styles.descBox}>
              <CustomText variant="body" style={styles.descText}>
                {state.mode === "infiltration"
                  ? t("games.cryptography_infiltration_desc")
                  : t("games.cryptography_interception_desc")}
              </CustomText>
            </View>

            {/* CRONÔMETRO + PALAVRAS/PULOS */}
            <View style={styles.section}>
              <CustomText variant="label" style={styles.cyanLabel}>
                {t("games.cryptography_lobby_timer")}
              </CustomText>
              <CustomText variant="body" style={styles.optText}>
                {t("games.cryptography_lobby_timeLimitText")}
              </CustomText>
              <View style={styles.optionsRow}>
                {(state.mode === "infiltration" ? state.infiltrationTimes : state.interceptionTimes).map((time: number) => (
                  <TouchableOpacity
                    key={time}
                    style={[styles.optionChip, state.roundTime === time && styles.optionActive]}
                    onPress={() => {
                      actions.updateConfig({ roundTime: time });
                      playSound("click2");
                    }}
                  >
                    <CustomText
                      variant="h3"
                      style={{ color: state.roundTime === time ? COLORS.background : COLORS.textSecondary }}
                    >
                      {time}s
                    </CustomText>
                  </TouchableOpacity>
                ))}
              </View>

              {state.mode === "interception" ? (
                <View style={{ marginTop: 25 }}>
                  <CustomText variant="label" style={styles.cyanLabel}>
                    {t("games.cryptography_lobby_wordLimit")}
                  </CustomText>
                  <CustomText variant="body" style={styles.optText}>
                    {t("games.cryptography_lobby_wordLimitText")}
                  </CustomText>
                  <View style={styles.optionsRow}>
                    {[5, 10, 20].map((w: number) => (
                      <TouchableOpacity
                        key={w}
                        style={[styles.optionChip, state.wordLimit === w && styles.optionActive]}
                        onPress={() => {
                          actions.updateConfig({ wordLimit: w });
                          playSound("click2");
                        }}
                      >
                        <CustomText
                          variant="h3"
                          style={{ color: state.wordLimit === w ? COLORS.background : COLORS.textSecondary }}
                        >
                          {w}
                        </CustomText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={{ marginTop: 25 }}>
                  <CustomText variant="label" style={styles.cyanLabel}>
                    {t("games.cryptography_lobby_skipLimit")}
                  </CustomText>
                  <CustomText variant="body" style={styles.optText}>
                    {t("games.cryptography_lobby_skipLimitText")}
                  </CustomText>
                  <View style={styles.optionsRow}>
                    {[3, 5, 999].map((w: number) => (
                      <TouchableOpacity
                        key={w}
                        style={[styles.optionChip, state.skipLimit === w && styles.optionActive]}
                        onPress={() => {
                          actions.updateConfig({ skipLimit: w });
                          playSound("click2");
                        }}
                      >
                        <CustomText
                          variant="h3"
                          style={{ color: state.skipLimit === w ? COLORS.background : COLORS.textSecondary }}
                        >
                          {w <= 5 ? w : "∞"}
                        </CustomText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* FLAGS DE VISIBILIDADE */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.categoryToggle, showFlags && styles.categoryToggleActive]}
                onPress={() => {
                  setShowFlags(!showFlags);
                  playSound("click2");
                }}
              >
                <CustomText variant="label" style={{ color: showFlags ? COLORS.background : COLORS.cyan }}>
                  {showFlags
                    ? t("games.cryptography_online_lobby_flagsClose") + " ⇡"
                    : t("games.cryptography_online_lobby_flags") + " ⇣"}
                </CustomText>
              </TouchableOpacity>

              {showFlags && (
                <View style={{ marginTop: 15 }}>
                  <View style={styles.flagRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <CustomText variant="label" style={styles.flagLabel}>
                        {t("games.cryptography_online_lobby_othersSeeWord")}
                      </CustomText>
                      <CustomText variant="hint" style={styles.flagSub}>
                        {t("games.cryptography_online_lobby_othersSeeWordSub")}
                      </CustomText>
                    </View>
                    <Switch
                      value={state.othersSeeWord}
                      onValueChange={(value) => {
                        actions.updateConfig({ othersSeeWord: value });
                        playSound("click2");
                      }}
                      trackColor={{ false: COLORS.surfaceLight, true: COLORS.cyan }}
                      thumbColor="#FFF"
                    />
                  </View>

                  <View style={styles.flagRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <CustomText variant="label" style={styles.flagLabel}>
                        {t("games.cryptography_online_lobby_operatorsSeeWordOnStandby")}
                      </CustomText>
                      <CustomText variant="hint" style={styles.flagSub}>
                        {t("games.cryptography_online_lobby_operatorsSeeWordOnStandbySub")}
                      </CustomText>
                    </View>
                    <Switch
                      value={state.operatorsSeeWordOnStandby}
                      onValueChange={(value) => {
                        actions.updateConfig({ operatorsSeeWordOnStandby: value });
                        playSound("click2");
                      }}
                      trackColor={{ false: COLORS.surfaceLight, true: COLORS.cyan }}
                      thumbColor="#FFF"
                    />
                  </View>
                </View>
              )}
            </View>

            {/* BANCO DE DADOS */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.categoryToggle, showCategories && styles.categoryToggleActive]}
                onPress={() => {
                  setShowCategories(!showCategories);
                  playSound("click2");
                }}
              >
                <CustomText variant="label" style={{ color: showCategories ? COLORS.background : COLORS.cyan }}>
                  {showCategories ? t("games.cryptography_lobby_close") + " ⇡" : t("games.cryptography_lobby_db") + " ⇣"}
                </CustomText>
              </TouchableOpacity>

              {showCategories && (
                <View style={styles.categoryGrid}>
                  {state.allCategories.map((cat: string) => {
                    const isSelected = state.selectedCategories.includes(cat);
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.categoryChip, isSelected && styles.activeChip]}
                        onPress={() => {
                          const next = isSelected
                            ? state.selectedCategories.filter((c) => c !== cat)
                            : [...state.selectedCategories, cat];
                          actions.updateConfig({ categories: next });
                          playSound("click2");
                        }}
                      >
                        <CustomText style={[styles.categoryText, isSelected && styles.activeCategoryText]}>{cat}</CustomText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        ) : (
          /* JOGADOR COMUM: espera o host configurar */
          <View style={styles.waitingBox}>
            <ActivityIndicator color={COLORS.cyan} size="large" />
            <CustomText variant="label" style={styles.waitingText}>
              {t("games.cryptography_online_lobby_waitingHost")}
            </CustomText>
          </View>
        )}
      </ScrollView>

      {/* RODAPÉ — SÓ O HOST INICIA */}
      {state.isHost && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.startBtn, !state.groupsReady && styles.startBtnDisabled]}
            disabled={!state.groupsReady || isWaiting}
            onPress={() => {
              playSound("click");
              runAction(actions.startGame);
            }}
          >
            {isWaiting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <View style={{ alignItems: "center" }}>
                <CustomText variant="h2" style={styles.startBtnText}>
                  {t("games.cryptography_lobby_start")}
                </CustomText>
                {!state.groupsReady && (
                  <CustomText variant="hint" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {t("games.cryptography_online_lobby_startHint")}
                  </CustomText>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingTop: 10, paddingBottom: 150 },
  section: { marginBottom: 30 },
  cyanLabel: { color: COLORS.cyan, marginBottom: 15, letterSpacing: 2, fontWeight: "800" },

  // ---- Entrada (criar/entrar) ----
  entrySegmented: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20
  },
  entrySegBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  entrySegActive: { backgroundColor: COLORS.surfaceLight },
  entrySegText: { fontSize: 13, fontWeight: "bold", color: COLORS.textSecondary },

  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 15,
    borderRadius: 14,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  infoIconWrapper: { marginRight: 15 },
  infoTextContainer: { flex: 1 },
  infoTitle: { color: COLORS.cyan, marginBottom: 4 },
  infoSubtitle: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 16 },

  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    color: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    fontSize: 16
  },
  lastRoomBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(0,242,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,242,255,0.3)"
  },
  lastRoomText: { color: COLORS.cyan },
  entryMainBtn: {
    backgroundColor: COLORS.cyan,
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
    elevation: 6
  },

  // ---- Sala ----
  roomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginBottom: 25
  },
  roomCodeDisplay: { color: COLORS.cyan, letterSpacing: 6, marginTop: 2 },
  hostBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,242,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8
  },
  hostBadgeText: { color: COLORS.cyan, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  leaveBtn: {
    alignItems: "center",
    backgroundColor: "rgba(255,0,60,0.08)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,0,60,0.3)"
  },
  leaveText: { color: COLORS.danger, fontSize: 10, fontWeight: "900", marginTop: 2 },

  createGroupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.cyan,
    padding: 14,
    borderRadius: 14,
    marginBottom: 15,
    elevation: 4
  },
  noGroupText: { color: COLORS.textSecondary, fontSize: 12, textAlign: "center", marginTop: 6 },

  groupCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderLeftWidth: 5,
    padding: 14,
    marginBottom: 15
  },
  groupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  groupName: { textTransform: "uppercase", fontSize: 18 },
  deleteGroupBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,0,60,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,0,60,0.25)"
  },

  sectionPlayers: { marginBottom: 30, gap: 20 },

  playerList: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  playerName: { flex: 1, marginLeft: 15, color: "#FFF", fontSize: 16 },
  playerActions: { flexDirection: "row", gap: 10, alignItems: "center" },

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

  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)"
  },

  membersRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)"
  },
  memberEmoji: { fontSize: 16 },
  memberName: { color: "#FFF", fontSize: 12, maxWidth: 100 },
  leaderBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  chipIconBtn: { padding: 4 },

  groupActionsRow: { flexDirection: "row", gap: 10, marginTop: 12, alignItems: "center", justifyContent: "center" },
  miniActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,242,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(0,242,255,0.3)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  miniActionText: { color: COLORS.cyan, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },

  inlineForm: { flexDirection: "row", gap: 8, marginTop: 10 },
  inlineInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 10,
    color: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    fontSize: 13
  },
  inlineAddBtn: {
    width: 42,
    backgroundColor: COLORS.cyan,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },

  moveArea: { marginTop: 10, alignItems: "center", justifyContent: "center" },
  moveHint: { color: COLORS.textSecondary, fontSize: 11, marginBottom: 8 },
  moveChip: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    minWidth: 64
  },
  moveChipEmoji: { fontSize: 18 },
  moveChipName: { color: "#FFF", fontSize: 10, maxWidth: 60 },

  joinGroupBtn: {
    marginTop: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,242,255,0.4)",
    borderRadius: 10,
    paddingVertical: 9,
    backgroundColor: "rgba(0,242,255,0.05)"
  },
  leaveGroupBtn: {
    borderColor: "rgba(255,0,60,0.4)",
    backgroundColor: "rgba(255,0,60,0.05)"
  },

  // ---- Config do host (visual do LobbyOffline) ----
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
  modeActive: { borderColor: COLORS.cyan, backgroundColor: "rgba(0,242,255,0.05)" },
  descBox: {
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  descText: { color: COLORS.textSecondary, textAlign: "center", fontSize: 14 },

  segmentedControl: { flexDirection: "row", backgroundColor: COLORS.surface, borderRadius: 14, padding: 4 },
  segBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  activeSeg: { backgroundColor: COLORS.surfaceLight },
  segText: { fontSize: 13, fontWeight: "bold", color: COLORS.textSecondary },

  settingCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  counter: { flexDirection: "row", alignItems: "center", gap: 15 },
  btnDisabled: { opacity: 0.25 },
  cBtn: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  cValue: { minWidth: 30, textAlign: "center", color: COLORS.cyan },

  optText: { color: COLORS.textSecondary, fontSize: 14, paddingBottom: 15 },
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

  categoryToggle: {
    padding: 18,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.cyan,
    alignItems: "center"
  },
  categoryToggleActive: { backgroundColor: COLORS.cyan },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 15 },
  categoryChip: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  activeChip: { backgroundColor: COLORS.cyan, borderColor: "#FFF" },
  categoryText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "800" },
  activeCategoryText: { color: COLORS.background, fontWeight: "bold" },

  // ---- Flags ----
  flagRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)"
  },
  flagLabel: { color: "#FFF", fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  flagSub: { color: COLORS.textSecondary, fontSize: 11, marginTop: 4, lineHeight: 15 },

  // ---- Espera ----
  waitingBox: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)"
  },
  waitingText: { color: COLORS.textSecondary, textAlign: "center", marginTop: 15, letterSpacing: 1 },

  waitingWatchPanel: { alignItems: "center", marginBottom: 20 },
  waitingWatchTitle: { color: COLORS.cyan, textAlign: "center", marginTop: 12 },
  waitingWatchSub: { color: COLORS.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 18 },
  watchGroupCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 2,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12
  },
  ghostLeaveBtn: { alignItems: "center", marginTop: 10, padding: 14 },

  // ---- Rodapé ----
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 35,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)"
  },
  startBtn: {
    backgroundColor: COLORS.cyan,
    padding: 20,
    borderRadius: 18,
    alignItems: "center",
    elevation: 15,
    shadowColor: COLORS.cyan,
    shadowRadius: 20,
    shadowOpacity: 0.6
  },
  startBtnDisabled: { opacity: 0.45, elevation: 0 },
  startBtnText: { color: COLORS.background, letterSpacing: 2 }
});
