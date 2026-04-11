import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
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
import { CustomText } from "@/styles/customText";
import { COLORS } from "@/styles/theme";
import {
  canShowAd,
  isInterstitialReady,
  isRewardedAdReady,
  markAdAsShown,
  showInterstitialAd,
  showRewardedAd
} from "@/services/ads/adsService";
import { useAlert } from "@/contexts/alertContext";

export const OnlineImpostorGameScreen = () => {
  const { t } = useTranslation();
  const hook = useOnlineImpostorGame();
  const { showAlert } = useAlert();

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
    isDataReady,
    actions
  } = hook;

  if (!gameData || !localPlayer) return null;

  const confirmAd = (callback: () => void, type: "rewarded" | "interstitial") => {
    if (!canShowAd()) return callback();

    if (type === "rewarded") {
      if (!isRewardedAdReady()) return callback();

      showAlert(t("alerts.advancedMode"), t("alerts.advancedModeDesc"), undefined, [
        { text: t("alerts.cancel"), style: "cancel" },
        {
          text: t("alerts.watchAd"),
          onPress: () => {showRewardedAd(callback); markAdAsShown()}
        }
      ]);

      return;
    }

    // interstitial
    if (!isInterstitialReady()) return callback();

    showInterstitialAd().then(callback).catch(callback);
    markAdAsShown();
  };

  // ✅ Se é espectador e dados NÃO estão prontos, mostra loading
  if (gameData.isSpectator && !isDataReady) {
    confirmAd(() => {}, "interstitial"); // Tenta mostrar um interstitial enquanto espera os dados, mas não bloqueia a renderização
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.cyan} />
          <CustomText variant="label" style={{ marginTop: 16, color: COLORS.textSecondary }}>
            {t("loading")}
          </CustomText>
        </View>
      </View>
    );
  }

  // Header do jogo
  const PhaseHeader = (
    <View style={styles.titleContainer}>
      <CustomText variant="h3" style={{ color: COLORS.danger }}>
        {t(`games.impostor_phase_header_title`)}
      </CustomText>
      <CustomText variant="label" style={{ fontSize: 14 }}>
        <CustomText variant="body" style={{ color: COLORS.white, fontSize: 14 }}>
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
        onGoBack={() => confirmAd(() => actions.handleExitAttempt(), "interstitial")}
      />

      <View style={{ flex: 1 }}>
        {/* Settings Modal */}
        <SettingsModal
          visible={openModal}
          onClose={() => setOpenModal(false)}
          showChangeWordBtn={gameData.phase === "reveal" && localPlayer.isHost}
          onReroll={actions.handleReroll}
          showReviewWordBtn={gameData.phase === "discussion" && !gameData.isSpectator}
          reviewEnabled={reviewEnabled}
          onToggleReview={setReviewEnabled}
        />

        {/* Reveal Phase */}
        {gameData.phase === "reveal" && !gameData.isSpectator && !showReport && (
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
        {gameData.phase === "discussion" && !gameData.isSpectator && !showReport && (
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
        {gameData.phase === "voting" && !gameData.isSpectator && !showReport && (
          <VotingPhase
            data={gameData}
            isOnline
            player={localPlayer}
            onCastVote={actions.handleCastVote}
            onVoteEnded={() => confirmAd(() => setShowReport(true), "interstitial")}
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
        {gameData.phase === "result" && !gameData.isSpectator && !showReport && (
          <ResultPhase data={gameData} isOnline onNextRound={() => confirmAd(() => actions.handleNextRound(), "rewarded")} />
        )}

        {/* Spectator View */}
        {gameData.isSpectator && <SpectatorView gameData={gameData} />}
      </View>

      {/* Review Word Modal */}
      <ReviewWordModal player={reviewPlayer} onClose={() => setReviewPlayer(null)} Onlinedata={gameData} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  titleContainer: { alignItems: "center" }
});
