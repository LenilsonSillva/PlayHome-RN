import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, BackHandler } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header/Header";
import { usePlayers } from "@/contexts/contextHook";
import { useOfflineCryptography } from "@/games/cryptography/hooks/useOfflineCryptography";

// Phases
import { useAlert } from "@/contexts/alertContext";
import { TeamRevealPhase } from "../phasesScreen/TeamRevealPhase";
import { InfiltrationAction } from "../phasesScreen/InfiltrationAction";
import { SettingsModal } from "@/components/SettingsModal/SettingsModal";
import { RoundResult } from "../phasesScreen/RoundResult";
import { InterceptionAction } from "../phasesScreen/InterceptionAction";
import { saveGlobalUsedWords } from "@/games/common/utils/wordStorage";
import { useAudio } from "@/contexts/audioContext";

export function OfflineCryptographyGameScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [openModal, setOpenModal] = useState<boolean>(false);
  const { showAlert } = useAlert();
  const { players } = usePlayers();

  const {
    gameState,
    startGame,
    setOperator,
    setStartingTeam,
    setRandomOperators,
    beginActionPhase,
    startTimer,
    handleInfiltrationWord,
    finishInfiltrationTurn,
    handleInterceptionResult,
    passInterceptionTurn,
    rerollWord,
    nextRound,
    quitGame
  } = useOfflineCryptography();
  const { playSound } = useAudio();

  // ⭐ Proteção de Rota (Evita crash se recarregar a tela do nada)
  useEffect(() => {
    if (!route.params?.config) {
      navigation.goBack();
    }
  }, [route.params?.config, navigation]);

  // ⭐ Dependências Corrigidas (Inicia o jogo apenas 1x)
  useEffect(() => {
    if (route.params?.config && players.length > 0 && !gameState) {
      startGame(
        players,
        route.params.config,
        route.params.manualAssignments,
        route.params.globalUsedWords,
        route.params.wordDatabase || [],
        route.params.langCode || ""
      );
    }
  }, [
    route.params?.config,
    route.params?.manualAssignments,
    route.params?.wordDatabase,
    route.params?.langCode,
    players,
    startGame,
    gameState
  ]);

  // ==========================================
  // 🔥 SEGURANÇA CONTRA SAÍDA ACIDENTAL
  // ==========================================

  // 1. Desativa o gesto de voltar (arrastar a tela) no iOS
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
    return () => navigation.setOptions({ gestureEnabled: true });
  }, [navigation]);

  useEffect(() => {
    // Esse código roda quando o componente "morre" (unmount)
    return () => {
      if (gameState?.usedWords && gameState.usedWords.length > 0) {
        // Chamada direta para garantir o salvamento ao sair da tela
        saveGlobalUsedWords(gameState.usedWords);
      }
    };
  }, [gameState?.usedWords]);

  const handleStartTimerWithSound = () => {
    playSound("alert");
    startTimer();
  };

  // Handler para o modo Infiltração
  type CardActionHandler = (type: "correct" | "skip") => void;

  const handleCardAction = (type: "correct" | "skip", originalOnAction: CardActionHandler) => {
    playSound(type === "correct" ? "success" : "skip");
    originalOnAction(type);
  };

  // 🔥 Handler para quando alguém pontua (Acerto) ou a rodada termina
  const handleInterceptionFinishWithSound = (winnerTeamIndex: number | null) => {
    // Se winnerTeamIndex for um número, alguém acertou (Success)
    // Se for null, pode ser um empate/pulo (Skip)
    playSound(winnerTeamIndex !== null ? "success" : "skip");

    // Executa a lógica original imediatamente
    handleInterceptionResult(winnerTeamIndex);
  };

  // 🔥 Handler para quando o turno passa (Erro/Pulo)
  const handlePassTurnWithSound = () => {
    playSound("skip");
    passInterceptionTurn();
  };

  // 2. Função Central de Alerta para confirmar a saída
  const handleExitGame = useMemo(
    () => () => {
      showAlert(t("alerts.header_quitGame"), t("alerts.cryptography_leaveGameMessage"), undefined, [
        { text: t("alerts.cancel"), style: "cancel" },
        {
          text: t("alerts.quit"),
          style: "destructive",
          onPress: () => {
            quitGame();
            // Como é offline, apenas destruímos a tela atual e forçamos o recarregamento do Lobby
            navigation.reset({
              index: 1,
              routes: [{ name: "Home" }, { name: "CryptographyLobby" }]
            });
          }
        }
      ]);
    },
    [navigation, showAlert, t, quitGame]
  );

  // 3. Trava o botão físico de voltar do celular (Android)
  useEffect(() => {
    const handleExitAttempt = () => {
      handleExitGame();
      return true; // Avisa ao sistema que nós controlamos a ação de voltar
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleExitAttempt);
    return () => backHandler.remove();
  }, [handleExitGame]);

  // ⭐ Header Memoizado + Nomes Traduzidos
  const PhaseHeader = useMemo(() => {
    const phaseKey = gameState?.phase ? gameState.phase.replace(/-/g, "_") : t("home.loading");
    return (
      <View style={styles.titleContainer}>
        <CustomText variant="label" style={{ color: COLORS.cyan }}>
          {t(`games.cryptography_title`)}
        </CustomText>
        <CustomText variant="h3" style={{ textTransform: "uppercase" }}>
          {gameState ? t(`games.cryptography_phase_${phaseKey}`) : "..."}
        </CustomText>
      </View>
    );
  }, [gameState?.phase, t]);

  if (!gameState) {
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
        <SettingsModal visible={openModal} onClose={() => setOpenModal(false)} />
      </View>
    );
  }

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
      <SettingsModal
        visible={openModal}
        onClose={() => setOpenModal(false)}
        showChangeWordBtn={gameState.phase === "interception-action"}
        onReroll={rerollWord}
      />

      <View style={styles.content}>
        {gameState.phase === "team-reveal" && (
          <TeamRevealPhase
            gameState={gameState}
            onSelectOperator={setOperator}
            onSetStartingTeam={setStartingTeam}
            onRandomizeOperators={setRandomOperators}
            onConfirm={beginActionPhase}
          />
        )}

        {gameState.phase === "infiltration-action" && (
          <InfiltrationAction
            gameState={gameState}
            onAction={(type) => handleCardAction(type, (actionType) => handleInfiltrationWord(actionType === "correct"))} // 🔥 Mapeia 'correct' para true, 'skip' para false
            onTimeUp={finishInfiltrationTurn}
            onStartTimer={handleStartTimerWithSound} // 🔥 onStartTimer no lugar de startTimer
          />
        )}

        {gameState.phase === "interception-action" && (
          <InterceptionAction
            gameState={gameState}
            onFinishMatch={handleInterceptionFinishWithSound}
            onPassTurn={handlePassTurnWithSound}
            onStartTimer={handleStartTimerWithSound}
          />
        )}

        {gameState.phase === "round-result" && <RoundResult gameState={gameState} onNextRound={nextRound} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  titleContainer: { alignItems: "center" },
  content: { flex: 1 }
});
