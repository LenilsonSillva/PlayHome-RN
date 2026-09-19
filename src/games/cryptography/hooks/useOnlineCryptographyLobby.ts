import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSocket } from "@/contexts/socketContext";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PLAYER_ICONS } from "@/games/common/constants/icons";
import { PLAYER_COLORS } from "@/games/common/constants/colors";
import { pickRandom } from "@/games/common/utils/array";
import { useTranslation } from "react-i18next";
import { useAlert } from "@/contexts/alertContext";
import i18n from "@/i18n";
import { translateCryptoError } from "../utils/translateCryptoError";
import type { CryptoConfigInput, CryptoGroupView, CryptoMode, CryptoRoomView, CryptoView } from "../types/online";

const PLAYER_ID_KEY = "playhome_crypto_player_id";
const LAST_ROOM_KEY = "playhome_crypto_last_room";

const DEFAULT_CATEGORIES = ["Objetos", "Animais", "Ciência", "Natureza", "Comida", "Emoções"];

// ============================================================
// Hook do LOBBY ONLINE do Criptografia.
// O servidor é a fonte da verdade: o cliente só emite intenções
// e renderiza `crypto:room-updated` (lobby) / `crypto:game-update`
// (partida). Regras: host configura e inicia; subHost gerencia o
// próprio grupo; operadores são definidos no team-reveal.
// ============================================================
export function useOnlineCryptographyLobby() {
  const socket = useSocket();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  // ---------------- Fluxo de entrada ---------------- //
  const [isCreating, setIsCreating] = useState(true);
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [lastRoomCode, setLastRoomCode] = useState<string | null>(null);
  const [inRoom, setInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [room, setRoom] = useState<CryptoRoomView | null>(null);

  // ---------------- Identidade persistente (reconexão) ---------------- //
  const myPlayerId = useRef<string | null>(null);

  // ---------------- Config do host (visual = LobbyOffline) ---------------- //
  const [mode, setMode] = useState<CryptoMode>("infiltration");
  const [distributionType, setDistributionType] = useState<"random" | "manual">("random");
  const [teamCount, setTeamCount] = useState(2);
  const [roundTime, setRoundTime] = useState(60);
  const [wordLimit, setWordLimit] = useState(5);
  const [skipLimit, setSkipLimit] = useState(3);
  const [othersSeeWord, setOthersSeeWord] = useState(true);
  const [operatorsSeeWordOnStandby, setOperatorsSeeWordOnStandby] = useState(true);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const infiltrationTimes = [60, 90, 120];
  const interceptionTimes = [15, 30, 60];

  useEffect(() => {
    setSelectedCategories([...allCategories]);
  }, [allCategories]);

  const generateId = () => Math.random().toString(36).substring(2, 9) + new Date().getTime().toString(36);

  const config: CryptoConfigInput = useMemo(
    () => ({
      mode,
      teamCount,
      distributionType,
      roundTime,
      wordLimit,
      skipLimit,
      categories: selectedCategories,
      othersSeeWord,
      operatorsSeeWordOnStandby
    }),
    [
      mode,
      teamCount,
      distributionType,
      roundTime,
      wordLimit,
      skipLimit,
      selectedCategories,
      othersSeeWord,
      operatorsSeeWordOnStandby
    ]
  );

  // ---------------- Utilidades de emissão ---------------- //
  const emitAsync = useCallback(
    (event: string, payload: unknown): Promise<any> =>
      new Promise((resolve, reject) => {
        if (!socket?.connected) return reject(t("alerts.lostConnection"));
        socket.emit(event, payload, (res: any) => {
          if (res?.error) return reject(translateCryptoError(res.error, t));
          resolve(res ?? {});
        });
      }),
    [socket, t]
  );

  const syncConfigFromRoom = useCallback((view: CryptoRoomView) => {
    const cfg = view.config;
    if (!cfg) return;
    setMode(cfg.mode);
    setDistributionType(cfg.distributionType);
    setTeamCount(cfg.teamCount);
    setRoundTime(cfg.roundTime);
    setWordLimit(cfg.wordLimit);
    setSkipLimit(cfg.skipLimit);
    setSelectedCategories(cfg.categories ?? []);
    setOthersSeeWord(cfg.othersSeeWord !== false);
    setOperatorsSeeWordOnStandby(cfg.operatorsSeeWordOnStandby !== false);
  }, []);

  // ---------------- Identidade + último código ---------------- //
  useEffect(() => {
    AsyncStorage.getItem(PLAYER_ID_KEY).then((value) => {
      myPlayerId.current = value || null;
    });
    AsyncStorage.getItem(LAST_ROOM_KEY).then((value) => {
      setLastRoomCode(value || null);
    });
  }, []);

  // ---------------- Categorias do servidor ---------------- //
  const fetchCategories = useCallback(() => {
    if (!socket) return;
    socket.emit("crypto:get-categories", { language: i18n.language }, (res: any) => {
      if (res?.ok && Array.isArray(res.categories)) {
        setAllCategories(res.categories);
        setSelectedCategories((prev) =>
          prev.length === 0 || !res.categories.some((c: string) => prev.includes(c)) ? res.categories : prev
        );
      }
    });
  }, [socket, i18n.language]);

  useEffect(() => {
    if (!socket) return;
    const onConnect = () => fetchCategories();
    if (socket.connected) fetchCategories();
    socket.on("connect", onConnect);
    return () => {
      socket.off("connect", onConnect);
    };
  }, [socket, fetchCategories]);

  // ---------------- Eventos da sala ---------------- //
  useEffect(() => {
    if (!socket) return;

    const onRoomUpdated = (view: CryptoRoomView) => {
      // 🔥 TRAVA DE SEGURANÇA: eu ainda estou na sala de verdade?
      const amIInRoom =
        view.players.some((p) => p.socketId === socket.id) || (view.waitingPlayers || []).some((p) => p.socketId === socket.id);
      if (!amIInRoom || !view.code) return;

      setRoom(view);
      setRoomCode(view.code);
      setInRoom(true);
      setIsHost(view.isHost);
      // Jogadores comuns espelham a config do host
      if (!view.isHost && view.config) syncConfigFromRoom(view);
    };

    const onGameUpdate = (data: CryptoView) => {
      navigation.navigate("OnlineCryptographyGame", { data });
    };

    const onPlayerLeft = ({ playerId, name: leftName, reason }: any) => {
      if (playerId === myPlayerId.current && reason === "kicked") {
        setInRoom(false);
        setRoom(null);
        showAlert(t("alerts.warning"), t("alerts.cryptography_kicked"));
        return;
      }
      if (leftName && playerId !== myPlayerId.current) {
        showAlert(
          reason === "kicked" ? t("alerts.warning") : t("games.cryptography_online_lobby_playerLeftTitle"),
          reason === "kicked"
            ? `${leftName} ${t("games.cryptography_online_lobby_playerKicked")}`
            : `${leftName} ${t("games.cryptography_online_lobby_playerLeft")}`
        );
      }
    };

    const onHostChanged = ({ newHostId }: { newHostId: string }) => {
      if (newHostId === socket.id) {
        setRoom((prev) => (prev ? { ...prev, isHost: true } : prev));
        setIsHost(true);
        showAlert(t("alerts.warning"), t("games.cryptography_online_lobby_newHost"));
      }
    };

    const onForceLobby = ({ reason }: { reason?: string }) => {
      setInRoom(false);
      setRoom(null);
      setIsHost(false);
      showAlert(t("alerts.warning"), t("games.cryptography_online_lobby_forceLobby"));
    };

    const onDisconnect = () => {
      // Só limpa se realmente estiver em uma sala (não afeta o offline)
      setInRoom((currentlyInRoom) => {
        if (currentlyInRoom) {
          setIsHost(false);
          setRoom(null);
          setRoomCode("");
        }
        return false;
      });
    };

    socket.on("crypto:room-updated", onRoomUpdated);
    socket.on("crypto:game-update", onGameUpdate);
    socket.on("crypto:player-left", onPlayerLeft);
    socket.on("crypto:host-changed", onHostChanged);
    socket.on("crypto:force-lobby", onForceLobby);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("crypto:room-updated", onRoomUpdated);
      socket.off("crypto:game-update", onGameUpdate);
      socket.off("crypto:player-left", onPlayerLeft);
      socket.off("crypto:host-changed", onHostChanged);
      socket.off("crypto:force-lobby", onForceLobby);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket, navigation, syncConfigFromRoom, t, showAlert]);

  // ---------------- Ações ---------------- //
  const persistLastRoom = useCallback((code: string) => {
    AsyncStorage.setItem(LAST_ROOM_KEY, code).catch(() => {});
    setLastRoomCode(code);
  }, []);

  const handleCreate = useCallback((): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (!socket?.connected) return reject(t("alerts.lostConnection"));
      if (!name.trim()) return reject(t("alerts.impostor_crewmateName") || t("alerts.fillIn"));

      if (!myPlayerId.current) {
        myPlayerId.current = generateId();
        AsyncStorage.setItem(PLAYER_ID_KEY, myPlayerId.current).catch(() => {});
      }

      const payload = {
        name: name.trim(),
        id: myPlayerId.current,
        emoji: pickRandom(PLAYER_ICONS),
        color: pickRandom(PLAYER_COLORS)
      };

      socket.emit("crypto:create-room", payload, (res: any) => {
        if (res?.error) return reject(translateCryptoError(res.error, t));
        setInRoom(true);
        setIsHost(true);
        if (res.roomCode) persistLastRoom(res.roomCode);
        resolve(true);
      });
    });
  }, [name, socket, t, persistLastRoom]);

  const handleJoin = useCallback((): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (!socket?.connected) return reject(t("alerts.lostConnection"));
      if (!name.trim() || !roomCode.trim()) return reject(t("alerts.fillIn"));

      if (!myPlayerId.current) {
        myPlayerId.current = generateId();
        AsyncStorage.setItem(PLAYER_ID_KEY, myPlayerId.current).catch(() => {});
      }

      const payload = {
        name: name.trim(),
        id: myPlayerId.current,
        emoji: pickRandom(PLAYER_ICONS),
        color: pickRandom(PLAYER_COLORS),
        roomCode: roomCode.toUpperCase()
      };

      socket.emit("crypto:join-room", payload, (res: any) => {
        if (res?.error) return reject(translateCryptoError(res.error, t));
        setInRoom(true);
        setIsHost(false);
        persistLastRoom(roomCode.toUpperCase());
        resolve(true);
      });
    });
  }, [name, roomCode, socket, t, persistLastRoom]);

  const chooseWaitingGroup = useCallback(
    (groupId: string): Promise<boolean> => {
      if (!room) return Promise.reject(t("alerts.lostConnection"));
      return new Promise((resolve, reject) => {
        socket?.emit("crypto:choose-waiting-group", { roomCode: room.code, groupId }, (res: any) => {
          if (res?.error) return reject(translateCryptoError(res.error, t));
          resolve(true);
        });
      });
    },
    [room, socket, t]
  );

  const leaveRoom = useCallback(() => {
    if (socket && roomCode) {
      socket.emit("crypto:leave-room", { roomCode });
    }
    setInRoom(false);
    setIsHost(false);
    setRoom(null);
    setRoomCode("");
  }, [socket, roomCode]);

  const updateConfig = useCallback(
    async (next: Partial<CryptoConfigInput>) => {
      if (!room) return;
      const merged: CryptoConfigInput = { ...config, ...next };
      setMode(merged.mode);
      setDistributionType(merged.distributionType);
      setTeamCount(merged.teamCount);
      setRoundTime(merged.roundTime);
      setWordLimit(merged.wordLimit);
      setSkipLimit(merged.skipLimit);
      setSelectedCategories(merged.categories);
      setOthersSeeWord(merged.othersSeeWord !== false);
      setOperatorsSeeWordOnStandby(merged.operatorsSeeWordOnStandby !== false);
      await emitAsync("crypto:update-config", {
        roomCode: room.code,
        config: merged
      });
    },
    [room, config, emitAsync]
  );

  const createGroup = useCallback(
    (): Promise<boolean> => emitAsync("crypto:create-group", { roomCode: room?.code }),
    [room, emitAsync]
  );

  const deleteGroup = useCallback(
    (groupId: string): Promise<boolean> => emitAsync("crypto:delete-group", { roomCode: room?.code, groupId }),
    [room, emitAsync]
  );

  const joinGroup = useCallback(
    (groupId: string): Promise<boolean> => emitAsync("crypto:join-group", { roomCode: room?.code, groupId }),
    [room, emitAsync]
  );

  const leaveGroup = useCallback(
    (): Promise<boolean> => emitAsync("crypto:leave-group", { roomCode: room?.code }),
    [room, emitAsync]
  );

  const assignToGroup = useCallback(
    (playerId: string, groupId: string): Promise<boolean> =>
      emitAsync("crypto:assign-to-group", { roomCode: room?.code, playerId, groupId }),
    [room, emitAsync]
  );

  const addPresentPlayer = useCallback(
    (presentName: string, groupId: string): Promise<boolean> =>
      emitAsync("crypto:add-present-player", {
        roomCode: room?.code,
        name: presentName,
        groupId,
        emoji: "🏠"
      }),
    [room, emitAsync]
  );

  const removePlayer = useCallback(
    (playerId: string): Promise<boolean> => emitAsync("crypto:remove-player", { roomCode: room?.code, playerId }),
    [room, emitAsync]
  );

  const setSubHost = useCallback(
    (groupId: string, playerId: string): Promise<boolean> =>
      emitAsync("crypto:set-subhost", { roomCode: room?.code, groupId, playerId }),
    [room, emitAsync]
  );

  const startGame = useCallback((): Promise<boolean> => {
    if (!room) return Promise.reject(t("alerts.lostConnection"));
    return emitAsync("crypto:start-game", {
      roomCode: room.code,
      config,
      language: i18n.language
    });
  }, [room, config, emitAsync]);

  const resetLobbyState = useCallback(() => {
    setInRoom(false);
    setIsHost(false);
    setRoom(null);
    setRoomCode("");
    setMode("infiltration");
    setDistributionType("random");
    setTeamCount(2);
    setRoundTime(60);
    setWordLimit(5);
    setSkipLimit(3);
    setOthersSeeWord(true);
    setOperatorsSeeWordOnStandby(true);
    setSelectedCategories(DEFAULT_CATEGORIES);
  }, []);

  // ---------------- Derivados (papéis/permisssões) ---------------- //
  const mySocketId = socket?.id ?? "";
  const myPlayer = useMemo(() => room?.players.find((p) => p.socketId === mySocketId) ?? null, [room, mySocketId]);
  const myGroupId = myPlayer?.groupId ?? null;

  const amWaitingToWatch = useMemo(
    () => !!room && room.phase === "playing" && (room.waitingPlayers || []).some((p) => p.socketId === mySocketId),
    [room, mySocketId]
  );

  const canManageGroup = useCallback(
    (groupId: string): boolean => {
      if (!room) return false;
      if (room.isHost) return true;
      const group = room.groups.find((g) => g.id === groupId);
      return !!group && group.subHostId === myPlayer?.id;
    },
    [room, myPlayer]
  );

  // Heurística local p/ habilitar o botão (o servidor é a autoridade final)
  const groupsReady = useMemo(() => {
    if (!room) return false;
    if (room.groups.length < 2) return false;
    return room.groups.every((g: CryptoGroupView) => {
      const members = [
        ...room.players.filter((p) => p.groupId === g.id),
        ...(room.presentPlayers || []).filter((p) => p.groupId === g.id)
      ];
      return members.length >= 2 && members.some((m) => "socketId" in m && m.connection === "online");
    });
  }, [room]);

  return {
    state: {
      isCreating,
      name,
      roomCode,
      lastRoomCode,
      inRoom,
      isHost,
      room,
      mode,
      distributionType,
      teamCount,
      roundTime,
      wordLimit,
      skipLimit,
      othersSeeWord,
      operatorsSeeWordOnStandby,
      allCategories,
      selectedCategories,
      infiltrationTimes,
      interceptionTimes,
      mySocketId,
      myPlayer,
      myGroupId,
      amWaitingToWatch,
      groupsReady
    },
    actions: {
      setIsCreating,
      setName,
      setRoomCode,
      handleCreate,
      handleJoin,
      chooseWaitingGroup,
      leaveRoom,
      updateConfig,
      createGroup,
      deleteGroup,
      joinGroup,
      leaveGroup,
      assignToGroup,
      addPresentPlayer,
      removePlayer,
      setSubHost,
      startGame,
      resetLobbyState,
      canManageGroup
    }
  };
}
