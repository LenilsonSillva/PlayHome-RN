import { useState, useEffect, useMemo, useCallback } from "react";
import { useSocket } from "@/contexts/socketContext";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PLAYER_ICONS } from "../constants/icons";
import { ICON_COLORS } from "../constants/colors";
import { pickRandom } from "@/games/common/utils/array";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { getWordDatabase } from "@/games/common/data/words";

export function useOnlineImpostorLobby() {
  const socket = useSocket();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  // Estados de Fluxo
  const [isCreating, setIsCreating] = useState(true);
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [lastRoomCode, setLastRoomCode] = useState<string | null>(null);
  const [inRoom, setInRoom] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [isHost, setIsHost] = useState(false);

  // Configurações do Jogo
  const [selectImpostorNumbers, setSelectImpostorNumbers] = useState(1);
  const [twoGroups, setTwoGroups] = useState(false);
  const [whoStart, setWhoStart] = useState(true);
  const [impostorCanStart, setImpostorCanStart] = useState(true);
  const [impostorsUnited, setImpostorsUnited] = useState(false);
  const [impostorHint, setImpostorHint] = useState(false);
  const [impostorTrap, setImpostorTrap] = useState(false);
  const [impostorCat, setImpostorCat] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const currentWords = useMemo(() => getWordDatabase(i18n.language), [i18n.language]);
  const ALL_CATEGORIES = useMemo(() => {
    return Array.from(new Set(currentWords.map((w) => w.category))).sort();
  }, [currentWords]);

  useEffect(() => {
    setSelectedCategories([...ALL_CATEGORIES]);
  }, [ALL_CATEGORIES]);

  const generateId = () => Math.random().toString(36).substring(2, 9) + new Date().getTime().toString(36);

  const maxImpostors = useMemo(() => {
    if (players.length >= 7) return 3;
    if (players.length >= 5) return 2;
    return 1;
  }, [players.length]);

  useEffect(() => {
    setSelectImpostorNumbers((p) => Math.min(p, maxImpostors));
    if (selectImpostorNumbers <= 1) setImpostorsUnited(false);
  }, [maxImpostors]);

  useEffect(() => {
    if (!impostorHint) {
      setImpostorTrap(false);
      setImpostorCat(false);
    }
  }, [impostorHint]);

  // Sincronização de Sockets e Storage
  useEffect(() => {
    AsyncStorage.getItem("lastRoomCode").then((val) => setLastRoomCode(val));

    if (!socket) return;

    const onRoomUpdated = (room: any) => {
      // 🔥 TRAVA DE SEGURANÇA: Eu ainda estou na sala de verdade?
      const amIStillInRoom = room.players.some((p: any) => p.socketId === socket.id);
      if (!amIStillInRoom || !room.code) return;

      setPlayers(room.players);
      setRoomCode(room.code);
      setInRoom(true);
      setIsHost(room.hostId === socket.id);
    };

    const onGameUpdate = (data: any) => {
      navigation.navigate("OnlineImpostorGame", { data });
    };

    const onDisconnect = () => {
      // 🔥 A SOLUÇÃO ESTÁ AQUI:
      // Só executa o bloco de limpeza e redirecionamento se você
      // realmente estiver em uma sala (inRoom).
      // Isso impede que jogadores no modo offline sejam chutados pro Lobby!
      setInRoom((currentlyInRoom) => {
        if (currentlyInRoom) {
          setIsHost(false);
          setPlayers([]);
          setRoomCode("");
          navigation.navigate("ImpostorLobby");
        }
        return false;
      });
    };

    socket.on("room-updated", onRoomUpdated);
    socket.on("game-update", onGameUpdate);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("room-updated", onRoomUpdated);
      socket.off("game-update", onGameUpdate);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket, navigation]);

  // Regra de dependência: Se Sorteio Início OFF -> Impostor Inicia OFF
  useEffect(() => {
    if (!whoStart) setImpostorCanStart(false);
  }, [whoStart]);

  const resetLobbyState = useCallback(() => {
    setInRoom(false);
    setIsHost(false);
    setPlayers([]);
    setRoomCode("");
    setSelectImpostorNumbers(1);
    setTwoGroups(false);
    setWhoStart(true);
    setImpostorCanStart(true);
    setImpostorsUnited(false);
    setImpostorHint(false);
    setSelectedCategories(["Objetos", "Animais", "Ciência", "Natureza", "Comida", "Emoções"]);
  }, []);

  const handleCreate = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!socket?.connected) return reject(t("alerts.lostConnection"));
      // 🔥 Adicionado Promise
      if (!name.trim()) return reject(t("alerts.impostor_crewmateName"));

      const payload = {
        name,
        id: generateId(),
        emoji: pickRandom(PLAYER_ICONS),
        color: pickRandom(ICON_COLORS)
      };

      socket?.emit("create-room", payload, (res: any) => {
        if (res.error) return reject(res.error); // 🔥 Rejeita com o erro do servidor

        setInRoom(true);
        setIsHost(true);
        if (res.roomCode) {
          AsyncStorage.setItem("lastRoomCode", res.roomCode);
          setLastRoomCode(res.roomCode);
        }
        resolve(true); // 🔥 Avisa que deu tudo certo!
      });
    });
  }, [name, socket]);

  const handleJoin = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!socket?.connected) return reject(t("alerts.lostConnection"));
      // 🔥 Adicionado Promise
      if (!name.trim() || !roomCode.trim()) return reject(t("alerts.fillIn"));

      const payload = {
        name,
        id: generateId(),
        emoji: pickRandom(PLAYER_ICONS),
        color: pickRandom(ICON_COLORS),
        roomCode: roomCode.toUpperCase()
      };

      socket?.emit("join-room", payload, (res: any) => {
        if (res.error) return reject(res.error); // 🔥 Rejeita se a sala não existir

        setInRoom(true);
        setIsHost(false);
        AsyncStorage.setItem("lastRoomCode", roomCode.toUpperCase());
        setLastRoomCode(roomCode.toUpperCase());
        resolve(true); // 🔥 Avisa que deu tudo certo!
      });
    });
  }, [name, roomCode, socket]);

  // 🔥 NOVA FUNÇÃO: Sair da sala e resetar estados
  const leaveRoom = useCallback(() => {
    if (socket && roomCode) {
      socket.emit("leave-room", { roomCode });
    }
    // O estado local é limpo na hora. Como criamos a trava no 'room-updated',
    // o app não vai mais te puxar de volta pro Lobby!
    setInRoom(false);
    setIsHost(false);
    setPlayers([]);
    setRoomCode("");
    navigation.navigate("ImpostorLobby");
  }, [socket, roomCode, navigation]);

  const startGame = () => {
    return new Promise((resolve, reject) => {
      if (!socket?.connected) return reject(t("alerts.lostConnection"));

      socket?.emit(
        "start-game",
        {
          roomCode,
          config: {
            howManyImpostors: selectImpostorNumbers,
            twoWordsMode: twoGroups,
            whoStart,
            impostorCanStart,
            impostorHasHint: impostorHint,
            impostorTrap,
            impostorCat,
            impostorsUnited,
            selectedCategories
          },
          language: i18n.language
        },
        (res: any) => {
          if (res?.error) return reject(res.error);
          resolve(true);
        }
      );
    });
  };

  return {
    state: {
      name,
      roomCode,
      lastRoomCode,
      inRoom,
      players,
      isHost,
      selectImpostorNumbers,
      twoGroups,
      whoStart,
      impostorCanStart,
      impostorsUnited,
      impostorHint,
      impostorCat,
      impostorTrap,
      selectedCategories,
      maxImpostors,
      isCreating,
      mySocketId: socket?.id || ""
    },
    actions: {
      setName,
      setRoomCode,
      setTwoGroups,
      setWhoStart,
      setImpostorCanStart,
      setImpostorHint,
      setImpostorCat,
      setImpostorTrap,
      setImpostorsUnited,
      setSelectedCategories,
      setSelectImpostorNumbers,
      handleCreate,
      handleJoin,
      startGame,
      setInRoom,
      setIsCreating,
      leaveRoom,
      resetLobbyState
    }
  };
}
