import React, { useEffect, useState } from "react";
import { View, StyleSheet, BackHandler } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSocket } from "@/contexts/socketContext";
import { COLORS } from "@/styles/theme";

// Importando componentes conforme sua estrutura
import { RevealPhase } from "../phasesScreen/RevealPhase";
import { DiscussPhase } from "../phasesScreen/DiscussPhase";
import { VotingPhase } from "../phasesScreen/VotingPhase";
import { ResultPhase } from "../phasesScreen/ResultPhase";
import { NewHostModal } from "../phasesScreen/components/NewHostModal";
import { SpectatorView } from "../phasesScreen/components/SpectatorView";
import {
  ImpostorPlayer,
  OnlineImpostorGame
} from "@/games/impostor/types/game";
import { CustomText } from "@/styles/customText";
import { SettingsModal } from "@/components/SettingsModal/SettingsModal";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header/Header";
import { ReviewWordModal } from "../phasesScreen/components/ReviewWordModal";
import { EliminatedReport } from "../phasesScreen/EliminatedReport";
import { useAlert } from "@/contexts/alertContext";

export function backup() {
  const { t } = useTranslation();
  const socket = useSocket();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [showReport, setShowReport] = useState(false); // Controla a visibilidade do relatório de eliminação
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [reviewEnabled, setReviewEnabled] = useState(false);
  const [storePlayer, setStorePlayer] = useState<string[]>([]);
  const [reviewPlayer, setReviewPlayer] = useState<ImpostorPlayer | null>(null);
  const [reveal, setReveal] = useState<boolean>(false); // Controla se é a primeira revelação ou se já passou por um reroll (para mostrar o indicador de palavra revelada após reroll)
  const { showAlert } = useAlert(); // 🔥 Só isso!

  // Sincroniza estado inicial vindo do Lobby
  // 1. INVERSÃO INICIAL (Quando entra na tela)
  const [gameData, setGameData] = useState<OnlineImpostorGame>(() => {
    const raw = route.params?.data || route.params;
    if (!raw) return null;

    const { allPlayers, score, globalScore, ...rest } = raw;

    return {
      ...rest,
      score: globalScore, // INVERTIDO
      globalScore: score, // INVERTIDO
      players: (allPlayers || []).map((p: ImpostorPlayer) => ({
        ...p,
        score: p.globalScore, // INVERTIDO
        globalScore: p.score // INVERTIDO
      })),
      mySocketId: socket?.id
    };
  });

  if (!gameData) return null;

  const eliminatedPlayer = gameData?.eliminatedId
    ? gameData.players.find(
        (p: ImpostorPlayer) => p.id === gameData.eliminatedId
      ) || null
    : null;
  const [showNewHostAlert, setShowNewHostAlert] = useState(false);

  const localPlayer = {
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

  useEffect(() => {
    if (gameData?.phase !== "voting") {
      setShowReport(false);
    }
    // Reseta os estados quando a fase muda para evitar que informações do jogo anterior persistam
    setReviewEnabled(false);
    setReviewPlayer(null);
    setStorePlayer([]);
  }, [gameData?.phase]);

  useEffect(() => {
    if (!socket) return;

    setGameData((prev: any) =>
      prev ? { ...prev, mySocketId: socket.id } : null
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

    function onPlayerLeft({ name }: { name: string }) {
      showAlert("Tripulação", `${name} saiu do jogo.`);
    }

    function onForceLobby() {
      showAlert("Erro", "Jogadores insuficientes. Voltando ao lobby.");
      navigation.reset({
        index: 1,
        routes: [{ name: "Home" }, { name: "ImpostorLobby" }]
      });
    }

    function onHostChanged({ newHostId }: { newHostId: string }) {
      const isNowHost = socket?.id === newHostId;
      setGameData((prev: any) =>
        prev ? { ...prev, isHost: isNowHost } : prev
      );

      if (isNowHost) {
        setShowNewHostAlert(true);
      }
    }

    socket.on("game-update", onGameUpdate);
    socket.on("player-left", onPlayerLeft);
    socket.on("force-lobby", onForceLobby);
    socket.on("host-changed", onHostChanged);

    // Trava para o botão voltar do Android
    const backAction = () => {
      showAlert("Sair da estação", "Deseja realmente sair da partida?", undefined, [
        { text: "CANCELAR", style: "cancel" },
        {
          text: "SAIR",
          style: "destructive",
          onPress: () =>
            navigation.reset({
              index: 1,
              routes: [{ name: "Home" }, { name: "ImpostorLobby" }]
            })
        }
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => {
      socket.off("game-update", onGameUpdate);
      socket.off("player-left", onPlayerLeft);
      socket.off("force-lobby", onForceLobby);
      socket.off("host-changed", onHostChanged);
      backHandler.remove();
    };
  }, [socket]);

  // --- LÓGICA DE AÇÕES (MESMAS DO SITE) ---

  const handleExitAttempt = () => {
    showAlert("Sair da Estação", "Deseja realmente abandonar a missão atual?", undefined, [
      {
        text: "CANCELAR",
        style: "cancel"
      },
      {
        text: "SAIR",
        style: "destructive",
        onPress: () => {
          // 🔥 Muito importante avisar o servidor que você saiu "de propósito"
          socket?.emit("leave-room", { roomCode: gameData.roomCode });
          navigation.reset({
            index: 1,
            routes: [{ name: "Home" }, { name: "ImpostorLobby" }]
          });
        }
      }
    ]);
    // 🔥 Retornar 'true' é o que avisa o Android: "Eu bloqueei o voltar nativo, não feche o app!"
    return true;
  };

  // Adicione este useEffect separado para controlar o botão físico do Android
  useEffect(() => {
    // 🔥 1. Bloqueia o gesto de deslizar (Swipe to Back) no iOS
    navigation.setOptions({
      gestureEnabled: false
    });

    // 🔥 2. Bloqueia o botão físico de voltar no Android
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleExitAttempt
    );

    return () => {
      backHandler.remove();
      // Opcional: Reabilitar o gesto caso a tela seja desmontada e o usuário volte ao Lobby
      navigation.setOptions({ gestureEnabled: true });
    };
  }, [navigation, gameData]);

  const handleNextPhase = (nextPhase: string) => {
    return new Promise((resolve, reject) => {
      if (!socket?.connected) return reject("Sem conexão com o servidor.");
      socket?.emit(
        "next-phase",
        {
          roomCode: gameData.roomCode,
          phase: nextPhase
        },
        (res: any) => {
          if (res.error) return reject(res.error); // 🔥 Rejeita com o erro do servidor
          resolve(true); // 🔥 Avisa que deu tudo certo!
        }
      );
    });
  };

  const handleReroll = () => {
    setReveal((prev) => !prev);
    socket?.emit("reroll-game", { roomCode: gameData.roomCode });
  };

  const handleToggleReady = () => {
    return new Promise((resolve, reject) => {
      if (!socket?.connected) return reject("Sem conexão com o servidor.");
      socket?.emit(
        "toggle-ready",
        { roomCode: gameData.roomCode },
        (res: any) => {
          if (res.error) return reject(res.error); // 🔥 Rejeita com o erro do servidor
          resolve(true); // 🔥 Avisa que deu tudo certo!
        }
      );
    });
  };

  const handleCastVote = (votedId: string | null) => {
    if (gameData.votingFinished) {
      socket?.emit("confirm-elimination", { roomCode: gameData.roomCode });
    } else {
      socket?.emit("cast-vote", { roomCode: gameData.roomCode, votedId });
    }
  };

  const handleNextRound = () => {
    socket?.emit("reroll-game", { roomCode: gameData.roomCode });
  };

  const playerHasSeenWord = (player: ImpostorPlayer) => {
    setReviewPlayer(player);
    if (!storePlayer.includes(player.id)) {
      setStorePlayer((prev) => [...prev, player.id]);
    }
  };

  const PhaseHeader = (
    <View style={styles.titleContainer}>
      <CustomText variant="h3" style={{ color: COLORS.danger }}>
        {t(`games.impostor_phase_header_title`)}
      </CustomText>
      <CustomText variant="label" style={{ fontSize: 14 }}>
        <CustomText
          variant="body"
          style={{ color: COLORS.white, fontSize: 14 }}
        >
          SALA:{" "}
        </CustomText>
        {gameData.roomCode}
      </CustomText>
    </View>
  );

  // --- RENDERS CONDICIONAIS ---

  if (showNewHostAlert) {
    return <NewHostModal onConfirm={() => setShowNewHostAlert(false)} />;
  }

  return (
    <View style={styles.container}>
      <Header
        centerElement={PhaseHeader}
        onOpenSettings={() => {
          setOpenModal(true);
        }}
        position="absolute"
        onGoBack={handleExitAttempt}
      />
      <View style={{ flex: 1 }}>
        <SettingsModal
          visible={openModal}
          onClose={() => setOpenModal(false)}
          showChangeWordBtn={gameData?.phase === "reveal" && localPlayer.isHost}
          onReroll={handleReroll}
          showReviewWordBtn={
            gameData?.phase === "discussion" && !gameData.isSpectator
          }
          reviewEnabled={reviewEnabled}
          onToggleReview={setReviewEnabled}
        />
        {gameData.phase === "reveal" &&
          !gameData.isSpectator &&
          !showReport && (
            <RevealPhase
              player={localPlayer}
              data={gameData}
              isOnline={true}
              onNext={() => handleNextPhase("discussion")}
              isLast={true}
              onPlayerReady={handleToggleReady}
              revealedAfterReroll={reveal}
            />
          )}
        {gameData.phase === "discussion" &&
          !gameData.isSpectator &&
          !showReport && (
            <DiscussPhase
              data={gameData}
              onNextVotingBtn={() => handleNextPhase("voting")}
              reviewEnabled={reviewEnabled} // Passa a permissão
              onPlayerPress={playerHasSeenWord} // Função de clique
              playerHasSeenWord={[]} // Passa os jogadores que já viram a palavra para mostrar o indicador visual
              isOnline
              onlinePlayer={localPlayer}
            />
          )}

        {gameData.phase === "voting" &&
          !gameData.isSpectator &&
          !showReport && (
            <VotingPhase
              data={gameData}
              isOnline
              player={localPlayer}
              onCastVote={handleCastVote}
              onVoteEnded={() => setShowReport(true)}
            />
          )}
        {showReport && !gameData.isSpectator && (
          <EliminatedReport
            player={eliminatedPlayer}
            allPlayers={gameData.players}
            votes={gameData.votes} // Passa os votos do hook
            wasVoting={true}
            isOnline
            onlinePlayer={gameData}
            onNext={() => {
              setShowReport(false);
              handleCastVote(null);
            }}
          />
        )}
        {gameData.phase === "result" &&
          !gameData.isSpectator &&
          !showReport && (
            <ResultPhase
              data={gameData}
              isOnline
              onNextRound={handleNextRound}
            />
          )}
        {gameData.isSpectator && <SpectatorView gameData={gameData} />}
      </View>
      <ReviewWordModal
        player={reviewPlayer}
        onClose={() => setReviewPlayer(null)}
        Onlinedata={gameData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  titleContainer: {
    alignItems: "center"
  }
});
