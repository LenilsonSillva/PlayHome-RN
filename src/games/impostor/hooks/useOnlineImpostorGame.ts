import { useEffect, useState, useCallback, useRef } from "react";
import { BackHandler } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSocket } from "@/contexts/socketContext";
import { useAlert } from "@/contexts/alertContext";
import { COLORS } from "@/styles/theme";
import {
  ImpostorPlayer,
  OnlineImpostorGame
} from "@/games/impostor/types/game";

export function useOnlineImpostorGame() {
  const socket = useSocket();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { showAlert } = useAlert();

  // --- UI / game state ---
  const [showReport, setShowReport] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [reviewEnabled, setReviewEnabled] = useState(false);
  const [storePlayer, setStorePlayer] = useState<string[]>([]);
  const [reviewPlayer, setReviewPlayer] = useState<ImpostorPlayer | null>(null);
  const [reveal, setReveal] = useState(false);
  const [showNewHostAlert, setShowNewHostAlert] = useState(false);

  // --- gameData ---
  const [gameData, setGameData] = useState<OnlineImpostorGame>(() => {
    const raw = route.params?.data || route.params;
    if (!raw) return null;

    const { allPlayers, score, globalScore, ...rest } = raw;

    return {
      ...rest,
      score: globalScore,
      globalScore: score,
      players: (allPlayers || []).map((p: ImpostorPlayer) => ({
        ...p,
        score: p.globalScore,
        globalScore: p.score
      })),
      mySocketId: socket?.id
    };
  });

  if (!gameData) return null;

  const eliminatedPlayer = gameData?.eliminatedId
    ? gameData.players.find((p) => p.id === gameData.eliminatedId) || null
    : null;

  // --- localPlayer derived state ---
  const localPlayer: ImpostorPlayer = {
    id: socket?.id || "",
    name: gameData?.myName || "VOCÊ",
    emoji: gameData.myEmoji || "🤫",
    color: gameData.myColor || COLORS.cyan,
    isImpostor: gameData.isImpostor,
    isHost: gameData.isHost,
    word: gameData.word,
    hint: gameData.hint,
    score: gameData.score || 0,
    globalScore: gameData.globalScore || 0,
    isAlive: gameData.isAlive,
    ready: gameData.ready,
    revealed: gameData.revealed,
    voted: gameData.voted
  };

  // --- Reset UI states on phase change ---
  useEffect(() => {
    if (gameData?.phase !== "voting") setShowReport(false);
    setReviewEnabled(false);
    setReviewPlayer(null);
    setStorePlayer([]);
  }, [gameData?.phase]);

  // --- Socket events for the game ---
  // refs to manage pending player-left alert and timers
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingLeftNameRef = useRef<string | null>(null);
  // rastreia qual jogador já teve alert de saída para evitar duplicatas
  const processedLeftPlayersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;

    // Atualiza meu socket id
    setGameData((prev: OnlineImpostorGame) =>
      prev ? { ...prev, mySocketId: socket.id } : prev
    );

    function onGameUpdate(data: any) {
      setGameData((prev: any) => {
        if (!data) return data;
        const { allPlayers, score, globalScore, ...rest } = data;

        const isHostFromServer =
          typeof data.isHost === "boolean"
            ? data.isHost
            : data.hostId === socket?.id;

        // Pegamos os jogadores que vieram do servidor
        const sourcePlayers = allPlayers || data.players || prev?.players || [];

        // Invertemos para todos do array de novo
        const invertedPlayers = sourcePlayers.map((p: any) => ({
          ...p,
          score: p.globalScore, // INVERTIDO
          globalScore: p.score // INVERTIDO
        }));

        return {
          ...rest,
          score: globalScore, // INVERTIDO
          globalScore: score, // INVERTIDO
          players: invertedPlayers,
          isHost: isHostFromServer,
          mySocketId: prev?.mySocketId || socket?.id
        };
      });
    }

    const schedulePlayerLeftAlert = (name: string) => {
      // cancela qualquer pendente e agenda um novo (pega o último saída)
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current as any);
        leaveTimeoutRef.current = null;
      }
      pendingLeftNameRef.current = name;
      leaveTimeoutRef.current = setTimeout(() => {
        // se ainda não houve force-lobby/host-change que cancelaremos, mostramos
        if (pendingLeftNameRef.current) {
          showAlert(
            "Tripulação",
            `${pendingLeftNameRef.current} saiu do jogo.`
          );
        }
        pendingLeftNameRef.current = null;
        leaveTimeoutRef.current = null;
      }, 400); // 400ms janela para priorizar host-change
    };

    const onPlayerLeft = ({ name }: { name: string }) => {
      // deduplicação: se já processamos esse jogador, ignora
      if (processedLeftPlayersRef.current.has(name)) {
        return;
      }
      processedLeftPlayersRef.current.add(name);
      schedulePlayerLeftAlert(name);
    };

    const cancelPendingPlayerLeft = () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current as any);
        leaveTimeoutRef.current = null;
      }
      pendingLeftNameRef.current = null;
    };

    const onForceLobby = () => {
      // force-lobby tem prioridade: cancela pendentes e mostra apenas esse
      cancelPendingPlayerLeft();
      showAlert("Erro", "Jogadores insuficientes. Voltando ao lobby.");
      navigation.reset({
        index: 1,
        routes: [{ name: "Home" }, { name: "ImpostorLobby" }]
      });
    };

    const onHostChanged = ({ newHostId }: { newHostId: string }) => {
      const isNowHost = socket?.id === newHostId;
      setGameData((prev) => (prev ? { ...prev, isHost: isNowHost } : prev));
      if (isNowHost) {
        // se esta máquina agora é host, cancela aviso de player-left e mostra apenas o host alert
        cancelPendingPlayerLeft();
        showAlert(
          "VOCÊ É O NOVO COMANDANTE!",
          "O comandante anterior desconectou, agora você assume o controle.",
          "👑"
        );
      }
    };

    socket.on("game-update", onGameUpdate);
    socket.on("player-left", onPlayerLeft);
    socket.on("force-lobby", onForceLobby);
    socket.on("host-changed", onHostChanged);

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleExitAttempt
    );

    return () => {
      socket.off("game-update", onGameUpdate);
      socket.off("player-left", onPlayerLeft);
      socket.off("force-lobby", onForceLobby);
      socket.off("host-changed", onHostChanged);
      // cleanup any pending timer
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current as any);
        leaveTimeoutRef.current = null;
      }
      processedLeftPlayersRef.current.clear();
      backHandler.remove();
    };
  }, [socket]);

  // --- Disable gestures + handle exit ---
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
    return () => navigation.setOptions({ gestureEnabled: true });
  }, [navigation]);

  const handleExitAttempt = useCallback(() => {
    showAlert(
      "Sair da Estação",
      "Deseja realmente abandonar a missão atual?",
      undefined,
      [
        { text: "CANCELAR", style: "cancel" },
        {
          text: "SAIR",
          style: "destructive",
          onPress: () => {
            socket?.emit("leave-room", { roomCode: gameData.roomCode });
            navigation.reset({
              index: 1,
              routes: [{ name: "Home" }, { name: "ImpostorLobby" }]
            });
          }
        }
      ]
    );
    return true;
  }, [gameData?.roomCode, navigation, socket]);

  // --- Game actions ---
  const handleNextPhase = (nextPhase: string) =>
    new Promise((resolve, reject) => {
      if (!socket?.connected) return reject("Sem conexão com o servidor.");
      socket?.emit(
        "next-phase",
        { roomCode: gameData.roomCode, phase: nextPhase },
        (res: any) => {
          if (res.error) return reject(res.error);
          resolve(true);
        }
      );
    });

  const handleReroll = () => {
    setReveal((prev) => !prev);
    socket?.emit("reroll-game", { roomCode: gameData.roomCode });
  };

  const handleToggleReady = () =>
    new Promise((resolve, reject) => {
      if (!socket?.connected) return reject("Sem conexão com o servidor.");
      socket?.emit(
        "toggle-ready",
        { roomCode: gameData.roomCode },
        (res: any) => {
          if (res.error) return reject(res.error);
          resolve(true);
        }
      );
    });

  const handleCastVote = (votedId: string | null) =>
    new Promise((resolve, reject) => {
      if (gameData.votingFinished) {
        socket?.emit(
          "confirm-elimination",
          { roomCode: gameData.roomCode },
          (res: any) => {
            if (res?.error) return reject(res.error);
            resolve(true);
          }
        );
      } else {
        socket?.emit(
          "cast-vote",
          { roomCode: gameData.roomCode, votedId },
          (res: any) => {
            if (res?.error) return reject(res.error);
            resolve(true);
          }
        );
      }
    });

  const handleNextRound = () => {
    socket?.emit("reroll-game", { roomCode: gameData.roomCode });
  };

  const playerHasSeenWord = (player: ImpostorPlayer) => {
    setReviewPlayer(player);
    if (!storePlayer.includes(player.id))
      setStorePlayer((prev) => [...prev, player.id]);
  };

  return {
    gameData,
    localPlayer,
    eliminatedPlayer,
    showReport,
    setShowReport,
    openModal,
    setOpenModal,
    reviewEnabled,
    setReviewEnabled,
    storePlayer,
    setStorePlayer,
    reviewPlayer,
    setReviewPlayer,
    reveal,
    showNewHostAlert,
    setShowNewHostAlert,
    actions: {
      handleExitAttempt,
      handleNextPhase,
      handleReroll,
      handleToggleReady,
      handleCastVote,
      handleNextRound,
      playerHasSeenWord
    }
  };
}
