import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, BackHandler } from "react-native";
import { useOfflineImpostor } from "@/games/impostor/hooks/useOfflineImpostor";
import { COLORS } from "@/styles/theme";
import { RevealPhase } from "../phasesScreen/RevealPhase";
import { DiscussPhase } from "../phasesScreen/DiscussPhase";
import { VotingPhase } from "../phasesScreen/VotingPhase";
import { EliminationPhase } from "../phasesScreen/EliminationPhase";
import { ResultPhase } from "../phasesScreen/ResultPhase";
import { usePlayers } from "@/contexts/contextHook";
import { SettingsModal } from "@/components/SettingsModal/SettingsModal";
import { CustomText } from "@/styles/customText";
import { Header } from "@/components/Header/Header";
import { useTranslation } from "react-i18next";
import { ImpostorPlayer } from "@/games/impostor/types/game";
import { EliminatedReport } from "../phasesScreen/EliminatedReport";
import { ReviewWordModal } from "../phasesScreen/components/ReviewWordModal";
import { useNavigation } from "expo-router";
import { saveGlobalUsedWords } from "@/games/common/utils/wordStorage";
import { useAlert } from "@/contexts/alertContext";

export const OfflineImpostorGameScreen = ({ route }: any) => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { showAlert } = useAlert();
  const { players } = usePlayers();
  const {
    game,
    startGame,
    nextPhase,
    handleReroll,
    eliminatePlayer,
    resolveElimination,
    processVotingResult,
    votes,
    submitVote
  } = useOfflineImpostor();

  const [openModal, setOpenModal] = useState<boolean>(false); // Controla a visibilidade do modal de configurações
  const [reveal, setReveal] = useState<boolean>(false); // Controla se é a primeira revelação ou se já passou por um reroll (para mostrar o indicador de palavra revelada após reroll)
  const [eliminatedTarget, setEliminatedTarget] = useState<ImpostorPlayer | null>(null); // Guarda o jogador que foi eliminado para mostrar no relatório
  const [showReport, setShowReport] = useState(false); // Controla a visibilidade do relatório de eliminação
  const [wasVoting, setWasVoting] = useState(false); // Controla se a eliminação foi resultado de uma votação ou de um relatório direto do host (para ajustar o texto do relatório)
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0); // Controla qual jogador está revelando a palavra no modo offline
  const [reviewEnabled, setReviewEnabled] = useState(false); // 1. Toggle do Modal
  const [reviewPlayer, setReviewPlayer] = useState<ImpostorPlayer | null>(null); // 2. Player selecionado
  const [storePlayer, setStorePlayer] = useState<string[]>([]); // 3. Player que já viu a palavra (pode ser usado para mostrar um indicador visual na lista de jogadores durante a discussão)

  useEffect(() => {
    // Reseta os estados quando a fase muda para evitar que informações do jogo anterior persistam
    setReviewEnabled(false);
    setReviewPlayer(null);
    setStorePlayer([]);
  }, [game?.phase]);

  useEffect(() => {
    // Dispara o início do jogo assim que a tela monta com os dados da rota
    if (route.params?.config && players.length > 0) {
      startGame(players, route.params.config);
    }
  }, [route.params?.config]);

  // 1. Desativa gesto de voltar no iOS

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
    return () => navigation.setOptions({ gestureEnabled: true });
  }, [navigation]);

  // 3. Função de Saída com Alerta
  const handleExitGame = useMemo(
    () => () => {
      showAlert(t("alerts.header_quitGame"), t("alerts.impostor_reallyLeave"), undefined, [
        { text: t("alerts.cancel"), style: "cancel" },
        {
          text: t("alerts.quit"),
          style: "destructive",
          onPress: () => {
            // Salva antes de sair
            if (game?.usedWords) saveGlobalUsedWords(game.usedWords);

            navigation.reset({
              index: 1,
              routes: [{ name: "Home" }, { name: "ImpostorLobby" }] // Ajuste para o nome do seu Lobby
            });
          }
        }
      ]);
    },
    [navigation, showAlert, t, game?.usedWords]
  );

  // 4. Trava botão voltar do Android
  useEffect(() => {
    const handleExitAttempt = () => {
      handleExitGame();
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleExitAttempt);
    return () => backHandler.remove();
  }, [handleExitGame]);

  // Função para avançar para o próximo jogador na fase de revelação ou para a próxima fase quando todos terminarem de revelar
  const handleNextReveal = () => {
    if (game && currentPlayerIndex < game.players.length - 1) {
      setCurrentPlayerIndex((prev) => prev + 1);
    } else {
      // Quando todos terminarem de revelar, vai para discussão
      nextPhase("discussion");
    }
  };

  // Função disparada pelo botão de reroll no modal de configurações durante a fase de revelação
  const onRerollPress = () => {
    // 1. O Hook sorteia a nova palavra
    handleReroll();
    // 2. A Screen volta para o primeiro jogador
    setCurrentPlayerIndex(0);
    setReveal((prev) => !prev);
  };

  // Função disparada pelo botão de confirmar eliminação no host ou pelo fim da votação (eliminationPhase)
  const handleSelectToEliminate = (player: ImpostorPlayer | null) => {
    setWasVoting(false);
    if (!player) {
      eliminatePlayer(null);
      resolveElimination(); // Se pular no host, vai direto
      return;
    }
    setEliminatedTarget(player);
    eliminatePlayer(player.id);
    setShowReport(true);
  };

  const handleVotingEnd = (finalVotedMap: Record<string, string | null>) => {
    setWasVoting(true);
    // 1. Calcula o resultado usando o mapa final síncrono da VotingPhase
    const winnerId = processVotingResult(finalVotedMap);
    const target = game?.players.find((p) => p.id === winnerId) || null;

    // 2. Define o alvo do relatório e marca a morte no hook
    setEliminatedTarget(target);
    eliminatePlayer(winnerId);

    setShowReport(true);
  };

  // Função disparada quando o host ou um jogador clica para revisar a palavra durante a discussão (playerHasSeenWord && useEffect de storePlayer)
  const playerHasSeenWord = (player: ImpostorPlayer) => {
    setReviewPlayer(player);
    if (!storePlayer.includes(player.id)) {
      setStorePlayer((prev) => [...prev, player.id]);
    }
  };

  useEffect(() => {
    if (storePlayer.length === game?.players.filter((p) => p.isAlive).length) {
      setReviewEnabled(false);
      setStorePlayer([]);
    }
  }, [storePlayer, game]);

  const PhaseHeader = (
    <View style={styles.titleContainer}>
      <CustomText variant="label" style={{ color: COLORS.danger }}>
        {t(`games.impostor_phase_header_title`)}
      </CustomText>
      <CustomText variant="h3">{t(`games.impostor_phase_${game?.phase}`)}</CustomText>
    </View>
  );

  if (!game) return null;

  return (
    <View style={styles.container}>
      <Header
        centerElement={PhaseHeader}
        onOpenSettings={() => {
          setOpenModal(true);
        }}
        onGoBack={handleExitGame}
        position="absolute"
      />
      <View style={{ flex: 1 }}>
        <SettingsModal
          visible={openModal}
          onClose={() => setOpenModal(false)}
          showChangeWordBtn={game?.phase === "reveal" && true}
          onReroll={onRerollPress}
          showReviewWordBtn={game?.phase === "discussion"}
          reviewEnabled={reviewEnabled}
          onToggleReview={setReviewEnabled}
        />
        {game.phase === "reveal" && (
          <RevealPhase
            player={game.players[currentPlayerIndex]}
            data={game}
            onNext={handleNextReveal}
            isLast={currentPlayerIndex === game.players.length - 1}
            revealedAfterReroll={reveal}
          />
        )}

        <ReviewWordModal player={reviewPlayer} onClose={() => setReviewPlayer(null)} />

        {game.phase === "discussion" && (
          <DiscussPhase
            data={game}
            onNextVotingBtn={() => nextPhase("voting")}
            onNextEliminationBtn={() => nextPhase("elimination")}
            reviewEnabled={reviewEnabled} // Passa a permissão
            onPlayerPress={playerHasSeenWord} // Função de clique
            playerHasSeenWord={storePlayer} // Passa os jogadores que já viram a palavra para mostrar o indicador visual
          />
        )}

        {game.phase === "voting" && !showReport && (
          <VotingPhase data={game} currentVoteState={submitVote} voteEnded={handleVotingEnd} />
        )}

        {game.phase === "elimination" && !showReport && (
          <EliminationPhase data={game} onConfirmElimination={handleSelectToEliminate} />
        )}
        {showReport && (
          <EliminatedReport
            player={eliminatedTarget}
            allPlayers={game.players}
            votes={votes} // Passa os votos do hook
            wasVoting={wasVoting}
            onNext={() => {
              setShowReport(false);
              resolveElimination();
            }}
          />
        )}

        {game.phase === "result" && (
          <ResultPhase
            data={game}
            onNextRound={() => {
              // 1. Reseta o índice de revelação para o primeiro jogador
              setCurrentPlayerIndex(0);
              // 2. O hook sorteia novo impostor e palavra mantendo os scores
              startGame();
            }}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  titleContainer: {
    alignItems: "center"
  }
});
