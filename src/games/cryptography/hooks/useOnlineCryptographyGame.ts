import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { BackHandler } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSocket } from "@/contexts/socketContext";
import { useAlert } from "@/contexts/alertContext";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CryptoView } from "../types/online";
import { translateCryptoError } from "../utils/translateCryptoError";

// Mesma identidade persistente usada pelo lobby (reconexão)
const PLAYER_ID_KEY = "playhome_crypto_player_id";

// ============================================================
// Hook da PARTIDA ONLINE do Criptografia.
// O servidor é a fonte da verdade: o cliente recebe a
// `CryptoView` personalizada (crypto:game-update) e só emite
// intenções. NENHUMA ação local muda o estado — os botões são
// habilitados apenas pelos `controls` que o servidor envia.
// ============================================================
export function useOnlineCryptographyGame() {
  const socket = useSocket();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  // ---------------- Estado (a view do servidor) ---------------- //
  const [view, setView] = useState<CryptoView | null>(() => route.params?.data ?? null);
  const viewRef = useRef<CryptoView | null>(view);
  viewRef.current = view;

  // Identidade persistente (p/ crypto:rejoin-room na reconexão)
  const myPlayerIdRef = useRef<string | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(PLAYER_ID_KEY).then((value) => {
      myPlayerIdRef.current = value || null;
    });
  }, []);

  // ---------------- Emissão com ack + erro traduzido ---------------- //
  const emit = useCallback(
    (event: string, payload: Record<string, unknown>, opts?: { silent?: boolean }) => {
      const roomCode = viewRef.current?.roomCode;
      if (!socket?.connected) {
        showAlert(t("alerts.error"), t("alerts.lostConnection"));
        return;
      }
      socket.emit(event, { roomCode, ...payload }, (res: any) => {
        if (res?.error && !opts?.silent) {
          showAlert(t("alerts.error"), translateCryptoError(res.error, t));
        }
      });
    },
    [socket, t, showAlert]
  );

  // ---------------- Eventos da partida ---------------- //
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingLeftNameRef = useRef<string | null>(null);
  const processedLeftPlayersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;

    const onGameUpdate = (data: CryptoView) => {
      if (data) setView(data);
    };

    const cancelPendingPlayerLeft = () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
        leaveTimeoutRef.current = null;
      }
      pendingLeftNameRef.current = null;
    };

    const schedulePlayerLeftAlert = (name: string) => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
        leaveTimeoutRef.current = null;
      }
      pendingLeftNameRef.current = name;
      // Janela curta para force-lobby/host-changed cancelarem o aviso
      leaveTimeoutRef.current = setTimeout(() => {
        if (pendingLeftNameRef.current) {
          showAlert(t("alerts.warning"), `${pendingLeftNameRef.current} ${t("games.cryptography_online_lobby_playerLeft")}`);
        }
        pendingLeftNameRef.current = null;
        leaveTimeoutRef.current = null;
      }, 400);
    };

    const onPlayerLeft = ({ playerId, name }: { playerId: string; name: string }) => {
      if (!name || processedLeftPlayersRef.current.has(playerId)) return;
      processedLeftPlayersRef.current.add(playerId);
      schedulePlayerLeftAlert(name);
    };

    const onHostChanged = ({ newHostId }: { newHostId: string }) => {
      if (newHostId === socket.id) {
        cancelPendingPlayerLeft();
        showAlert(t("alerts.warning"), t("games.cryptography_online_lobby_newHost"));
      }
      // A view seguinte (crypto:game-update) já traz isHost/controls novos
    };

    const onForceLobby = () => {
      cancelPendingPlayerLeft();
      setView(null);
      showAlert(t("alerts.warning"), t("games.cryptography_online_game_forceLobby"));
      navigation.reset({
        index: 1,
        routes: [{ name: "Home" }, { name: "CryptographyLobby" }]
      });
    };

    // Reconexão: o socketId muda, o playerId não. Pede a view de
    // volta ao servidor (lobby e partida) pelo id persistente.
    const onConnect = () => {
      const current = viewRef.current;
      if (current?.roomCode && myPlayerIdRef.current) {
        socket.emit(
          "crypto:rejoin-room",
          { roomCode: current.roomCode, playerId: myPlayerIdRef.current },
          (res: any) => {
            if (res?.error) {
              setView(null);
              showAlert(t("alerts.error"), translateCryptoError(res.error, t));
              navigation.reset({
                index: 1,
                routes: [{ name: "Home" }, { name: "CryptographyLobby" }]
              });
            }
          }
        );
      }
    };

    socket.on("crypto:game-update", onGameUpdate);
    socket.on("crypto:player-left", onPlayerLeft);
    socket.on("crypto:host-changed", onHostChanged);
    socket.on("crypto:force-lobby", onForceLobby);
    socket.on("connect", onConnect);

    return () => {
      socket.off("crypto:game-update", onGameUpdate);
      socket.off("crypto:player-left", onPlayerLeft);
      socket.off("crypto:host-changed", onHostChanged);
      socket.off("crypto:force-lobby", onForceLobby);
      socket.off("connect", onConnect);
      cancelPendingPlayerLeft();
      processedLeftPlayersRef.current.clear();
    };
  }, [socket, navigation, t, showAlert]);

  // ---------------- Sair da partida ---------------- //
  const handleExit = useCallback(() => {
    showAlert(t("alerts.header_quitGame"), t("alerts.cryptography_leaveGameMessage"), undefined, [
      { text: t("alerts.cancel"), style: "cancel" },
      {
        text: t("alerts.quit"),
        style: "destructive",
        onPress: () => {
          emit("crypto:leave-room", {}, { silent: true });
          navigation.reset({
            index: 1,
            routes: [{ name: "Home" }, { name: "CryptographyLobby" }]
          });
        }
      }
    ]);
    return true; // consumimos o back
  }, [emit, navigation, t, showAlert]);

  // Trava o gesto de voltar (iOS) e o botão físico (Android)
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
    return () => navigation.setOptions({ gestureEnabled: true });
  }, [navigation]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleExit);
    return () => backHandler.remove();
  }, [handleExit]);

  // ---------------- Ações (intenções para o servidor) ---------------- //
  const actions = useMemo(
    () => ({
      setOperator: (teamId: string, playerId: string) =>
        emit("crypto:set-operator", { teamId, playerId }),
      setRandomOperators: () => emit("crypto:set-random-operators", {}),
      setStartingTeam: (teamIndex: number) =>
        emit("crypto:set-starting-team", { teamIndex }),
      beginAction: () => emit("crypto:begin-action", {}),
      startTimer: () => emit("crypto:start-timer", {}),
      wordAction: (success: boolean) =>
        emit("crypto:word-action", { success }),
      finishTurn: () => emit("crypto:finish-turn", {}),
      interceptionResult: (winnerTeamIndex: number) =>
        emit("crypto:interception-result", { winnerTeamIndex }),
      passTurn: () => emit("crypto:pass-turn", {}),
      requestWordChange: () => emit("crypto:reroll-word", {}),
      approveWordChange: (requestId: string) =>
        emit("crypto:approve-reroll-word", { requestId }),
      rejectWordChange: (requestId: string) =>
        emit("crypto:reject-reroll-word", { requestId }),
      reassignWord: (wordIndex: number, newWinnerIndex: number | null) =>
        emit("crypto:reassign-word", { wordIndex, newWinnerIndex }),
      nextRound: () => emit("crypto:next-round", {})
    }),
    [emit]
  );

  // ---------------- Derivados (papéis da view) ---------------- //
  const derived = useMemo(() => {
    if (!view) return null;
    // Quando o operador é presencial, actingPlayerId é o jogador em
    // nome de quem o dispositivo (delegado ao subHost) está atuando.
    const actingPlayerId = view.actingPlayerId ?? view.myPlayerId;
    const isOperator = view.teams.some((team) => team.operatorId === actingPlayerId);
    const myTeam = view.myTeamIndex >= 0 ? (view.teams[view.myTeamIndex] ?? null) : null;
    return {
      actingPlayerId,
      isOperator,
      myTeam,
      // O host NÃO aparece aqui: canControl só é true para o operador
      // do grupo da vez (o servidor já aplica essa regra).
      isController: view.controls.canControl,
      isMemberOfCurrentTeam:
        !view.isSpectator && view.myTeamIndex === view.currentTeamIndex,
      timerRunning: view.roundEndTime != null
    };
  }, [view]);

  return { view, derived, actions, handleExit };
}