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
// import { InterceptionAction } from "./phasesScreen/InterceptionAction";
// import { ResultPhase } from "./phasesScreen/ResultPhase";

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

  // ⭐ Proteção de Rota (Evita crash se recarregar a tela do nada)
  useEffect(() => {
    if (!route.params?.config) {
      navigation.goBack();
    }
  }, [route.params?.config, navigation]);

  // ⭐ Dependências Corrigidas (Inicia o jogo apenas 1x)
  useEffect(() => {
    if (route.params?.config && players.length > 0 && !gameState) {
      startGame(players, route.params.config, route.params.manualAssignments);
    }
  }, [route.params?.config, route.params?.manualAssignments, players, startGame, gameState]);

  // ==========================================
  // 🔥 SEGURANÇA CONTRA SAÍDA ACIDENTAL
  // ==========================================

  // 1. Desativa o gesto de voltar (arrastar a tela) no iOS
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
    return () => navigation.setOptions({ gestureEnabled: true });
  }, [navigation]);

  // 2. Função Central de Alerta para confirmar a saída
  const handleExitGame = useMemo(
    () => () => {
      showAlert(t("SAIR DA PARTIDA"), t("Deseja realmente abandonar a partida atual?"), undefined, [
        { text: t("alerts.cancel", "CANCELAR"), style: "cancel" },
        {
          text: t("alerts.quit", "SAIR"),
          style: "destructive",
          onPress: () => {
            // Como é offline, apenas destruímos a tela atual e forçamos o recarregamento do Lobby
            navigation.reset({
              index: 1,
              routes: [{ name: "Home" }, { name: "CryptographyLobby" }]
            });
          }
        }
      ]);
    },
    [navigation, showAlert, t]
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
    const phaseKey = gameState?.phase ? gameState.phase.replace(/-/g, "_") : "loading";
    return (
      <View style={styles.titleContainer}>
        <CustomText variant="label" style={{ color: COLORS.cyan }}>
          {t(`games.cryptography_title`, "CRIPTOGRAFIA")}
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
            onAction={(type) => handleInfiltrationWord(type === "correct")} // 🔥 Mapeia 'correct' para true, 'skip' para false
            onTimeUp={finishInfiltrationTurn}
            onStartTimer={startTimer} // 🔥 onStartTimer no lugar de startTimer
          />
        )}

        {gameState.phase === "interception-action" && (
          <InterceptionAction
            gameState={gameState}
            onFinishMatch={handleInterceptionResult}
            onPassTurn={passInterceptionTurn}
            onStartTimer={startTimer}
          />
        )}

        {gameState.phase === "round-result" && <RoundResult gameState={gameState} onNextRound={nextRound} />}

        {/* ... outras fases ... */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  titleContainer: { alignItems: "center" },
  content: { flex: 1 }
});
