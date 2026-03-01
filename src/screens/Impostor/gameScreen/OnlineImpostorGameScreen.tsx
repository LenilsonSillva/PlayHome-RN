import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useOnlineImpostorGame } from "@/games/impostor/hooks/useOnlineImpostorGame";
import { Header } from "@/components/Header/Header";
import { SettingsModal } from "@/components/SettingsModal/SettingsModal";
import { RevealPhase } from "../phasesScreen/RevealPhase";
import { DiscussPhase } from "../phasesScreen/DiscussPhase";
import { VotingPhase } from "../phasesScreen/VotingPhase";
import { EliminatedReport } from "../phasesScreen/EliminatedReport";
import { ResultPhase } from "../phasesScreen/ResultPhase";
import { SpectatorView } from "../phasesScreen/components/SpectatorView";
import { ReviewWordModal } from "../phasesScreen/components/ReviewWordModal";
import { NewHostModal } from "../phasesScreen/components/NewHostModal";
import { CustomText } from "@/styles/customText";
import { COLORS } from "@/styles/theme";

export const OnlineImpostorGameScreen = () => {
  const { t } = useTranslation();
  const hook = useOnlineImpostorGame();

  if (!hook) return null; // Se for null, não renderiza nada

  const {
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
    reviewPlayer,
    setReviewPlayer,
    reveal,
    showNewHostAlert,
    setShowNewHostAlert,
    actions
  } = hook;

  if (!gameData || !localPlayer) return null;

  // Header do jogo
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

  return (
    <View style={styles.container}>
      <Header
        centerElement={PhaseHeader}
        onOpenSettings={() => setOpenModal(true)}
        position="absolute"
        onGoBack={actions.handleExitAttempt}
      />

      <View style={{ flex: 1 }}>
        {/* Settings Modal */}
        <SettingsModal
          visible={openModal}
          onClose={() => setOpenModal(false)}
          showChangeWordBtn={gameData.phase === "reveal" && localPlayer.isHost}
          onReroll={actions.handleReroll}
          showReviewWordBtn={
            gameData.phase === "discussion" && !gameData.isSpectator
          }
          reviewEnabled={reviewEnabled}
          onToggleReview={setReviewEnabled}
        />

        {/* Reveal Phase */}
        {gameData.phase === "reveal" &&
          !gameData.isSpectator &&
          !showReport && (
            <RevealPhase
              player={localPlayer}
              data={gameData}
              isOnline
              onNext={() => actions.handleNextPhase("discussion")}
              isLast
              onPlayerReady={actions.handleToggleReady}
              revealedAfterReroll={reveal}
            />
          )}

        {/* Discussion Phase */}
        {gameData.phase === "discussion" &&
          !gameData.isSpectator &&
          !showReport && (
            <DiscussPhase
              data={gameData}
              onNextVotingBtn={() => actions.handleNextPhase("voting")}
              reviewEnabled={reviewEnabled}
              onPlayerPress={actions.playerHasSeenWord}
              playerHasSeenWord={[]}
              isOnline
              onlinePlayer={localPlayer}
            />
          )}

        {/* Voting Phase */}
        {gameData.phase === "voting" &&
          !gameData.isSpectator &&
          !showReport && (
            <VotingPhase
              data={gameData}
              isOnline
              player={localPlayer}
              onCastVote={actions.handleCastVote}
              onVoteEnded={() => setShowReport(true)}
            />
          )}

        {/* Eliminated Report */}
        {showReport && !gameData.isSpectator && (
          <EliminatedReport
            player={eliminatedPlayer}
            allPlayers={gameData.players}
            votes={gameData.votes}
            wasVoting={true}
            isOnline
            onlinePlayer={gameData}
            onNext={async () => {
              // Aguarda resposta do backend antes de sair da tela
              await actions.handleCastVote(null);
              // Só agora esconde o EliminatedReport
              setShowReport(false);
            }}
          />
        )}

        {/* Result Phase */}
        {gameData.phase === "result" &&
          !gameData.isSpectator &&
          !showReport && (
            <ResultPhase
              data={gameData}
              isOnline
              onNextRound={actions.handleNextRound}
            />
          )}

        {/* Spectator View */}
        {gameData.isSpectator && <SpectatorView gameData={gameData} />}
      </View>

      {/* Review Word Modal */}
      <ReviewWordModal
        player={reviewPlayer}
        onClose={() => setReviewPlayer(null)}
        Onlinedata={gameData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  titleContainer: { alignItems: "center" }
});
