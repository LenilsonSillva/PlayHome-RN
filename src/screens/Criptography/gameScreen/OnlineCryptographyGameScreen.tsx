import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useRoute } from "@react-navigation/native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header/Header";
import { SettingsModal } from "@/components/SettingsModal/SettingsModal";
import { useAudio } from "@/contexts/audioContext";
import { useOnlineCryptographyGame } from "@/games/cryptography/hooks/useOnlineCryptographyGame";
import { viewToGameState, serverTimeOffset } from "@/games/cryptography/utils/onlineViewMapper";
import { TeamRevealPhase } from "../phasesScreen/TeamRevealPhase";
import { InfiltrationAction } from "../phasesScreen/InfiltrationAction";
import { InterceptionAction } from "../phasesScreen/InterceptionAction";
import { RoundResult } from "../phasesScreen/RoundResult";
import { OnlineWaitingScreen } from "../phasesScreen/components/OnlineWaitingScreen";
import { WordChangeConsensus } from "../phasesScreen/components/WordChangeConsensus";

// ============================================================
// TELA DE PARTIDA ONLINE — Criptografia
//
// O servidor (source of truth) manda a `CryptoView`
// personalizada; a tela só roteia por FASE + PAPEL:
//
//   team-reveal          → TeamRevealPhase (botões só p/ quem
//                          o `controls`/`canSetOperator` deixa)
//   infiltration-action  → operador da vez: InfiltrationAction
//                          membro do grupo: "seu grupo está jogando"
//                          demais: "aguarde sua vez"
//   interception-action  → consenso pendente: WordChangeConsensus
//                          operador da vez: InterceptionAction
//                          demais: "fique atento"
//   round-result         → RoundResult (avantar/auditar só p/ host)
//
// Regras mantidas: host NÃO controla a ação de outro grupo
// (canControl), só operadores trocam a palavra (consenso) e o
// resto da sala assiste. Sons/vibrações = idênticos ao offline
// (playSound já embute os haptics).
// ============================================================
export function OnlineCryptographyGameScreen() {
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { playSound } = useAudio();
  const [openModal, setOpenModal] = useState(false);
  const { view, derived, actions, handleExit } = useOnlineCryptographyGame();

  // Estado compartilhado pelas fases offline (visão já filtrada)
  const gameState = useMemo(() => (view ? viewToGameState(view) : null), [view]);

  // ⏱️ Sincronização de relógio (mesmo padrão do Impostor online):
  // offset = serverTime da view - Date.now() no recebimento. Fica
  // memoizado por view para o cronômetro não "pular" a cada render.
  const serverOffset = useMemo(() => serverTimeOffset(view?.serverTime), [view?.serverTime]);

  // 🔊 "end" quando O SERVIDOR zera o cronômetro (só no dispositivo
  // que controla — mesmo comportamento sonoro do modo offline)
  const roundEndTime = view?.roundEndTime ?? null;
  const isController = view?.controls.canControl ?? false;
  useEffect(() => {
    if (!roundEndTime || !isController) return;
    const end = roundEndTime;
    const id = setInterval(() => {
      if (Date.now() + serverOffset >= end) {
        clearInterval(id);
        playSound("end");
      }
    }, 200);
    return () => clearInterval(id);
  }, [roundEndTime, isController, serverOffset, playSound]);

  // ⭐ Header (mesma linguagem visual do offline + sala/rodada)
  const PhaseHeader = useMemo(() => {
    const phaseKey = view?.phase ? view.phase.replace(/-/g, "_") : "";
    return (
      <View style={styles.titleContainer}>
        <CustomText variant="label" style={{ color: COLORS.cyan }}>
          {t("games.cryptography_title")}
        </CustomText>
        <CustomText variant="h3" style={{ textTransform: "uppercase" }}>
          {view ? t(`games.cryptography_phase_${phaseKey}`) : "..."}
        </CustomText>
        {view ? (
          <CustomText variant="hint" style={{ color: COLORS.textSecondary, letterSpacing: 1 }}>
            {t("games.cryptography_online_game_round", "RODADA")} {view.roundNumber} ·{" "}
            {t("games.cryptography_online_game_room", "SALA")} {view.roomCode}
          </CustomText>
        ) : null}
      </View>
    );
  }, [view, t]);

  const loading = (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.cyan} />
      <CustomText variant="label" style={styles.loadingText}>
        {t("home.loading", "Carregando...")}
      </CustomText>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        centerElement={PhaseHeader}
        onOpenSettings={() => setOpenModal(true)}
        onGoBack={() => handleExit()}
        position="absolute"
      />
      <SettingsModal
        visible={openModal}
        onClose={() => setOpenModal(false)}
        showChangeWordBtn={
          (view?.phase === "interception-action" && view?.controls.canRequestWordChange) || view?.controls.canReroll
        }
        onReroll={actions.requestWordChange}
      />

      {!view || !gameState || !derived ? (
        loading
      ) : (
        <View style={styles.content}>
          {/* ---------------- DEFINIÇÃO DE OPERADORES ---------------- */}
          {view.phase === "team-reveal" && (
            <TeamRevealPhase
              gameState={gameState}
              canChooseOperator={(team) => !!team.canSetOperator}
              canAct={view.controls.canBeginAction}
              canSetStartingTeam={view.controls.canSetStartingTeam}
              onSelectOperator={(teamId, playerId) => actions.setOperator(teamId, playerId)}
              onRandomizeOperators={() => actions.setRandomOperators()}
              onSetStartingTeam={(teamIndex) => actions.setStartingTeam(teamIndex)}
              onConfirm={() => actions.beginAction()}
            />
          )}

          {/* ---------------- INFILTRAÇÃO ---------------- */}
          {view.phase === "infiltration-action" && derived.isController && (
            <InfiltrationAction
              gameState={gameState}
              serverDriven
              serverOffset={serverOffset}
              onAction={(type) => {
                playSound(type === "correct" ? "success" : "skip");
                actions.wordAction(type === "correct");
              }}
              onTimeUp={() => {
                // O servidor encerra o turno — nunca o cliente
              }}
              onStartTimer={() => {
                playSound("alert");
                actions.startTimer();
              }}
            />
          )}
          {view.phase === "infiltration-action" && !derived.isController && (
            <OnlineWaitingScreen view={view} variant={derived.isMemberOfCurrentTeam ? "yourGroup" : "waitTurn"} />
          )}

          {/* ---------------- INTERCEPTAÇÃO ---------------- */}
          {view.phase === "interception-action" && view.wordChangeRequest ? (
            <WordChangeConsensus
              view={view}
              onApprove={(requestId) => {
                playSound("click");
                actions.approveWordChange(requestId);
              }}
              onReject={(requestId) => {
                playSound("click");
                actions.rejectWordChange(requestId);
              }}
            />
          ) : view.phase === "interception-action" && derived.isController ? (
            <InterceptionAction
              gameState={gameState}
              serverDriven
              serverOffset={serverOffset}
              onFinishMatch={(winnerTeamIndex) => {
                playSound("success");
                if (typeof winnerTeamIndex === "number") {
                  actions.interceptionResult(winnerTeamIndex);
                }
              }}
              onPassTurn={() => {
                playSound("skip");
                actions.passTurn();
              }}
              onStartTimer={() => {
                playSound("alert");
                actions.startTimer();
              }}
            />
          ) : view.phase === "interception-action" ? (
            <OnlineWaitingScreen
              view={view}
              variant="stayAlert"
              onRequestWordChange={
                view.controls.canRequestWordChange || view.controls.canReroll
                  ? () => {
                      playSound("click2");
                      actions.requestWordChange();
                    }
                  : undefined
              }
            />
          ) : null}

          {/* ---------------- RESULTADO DA RODADA ---------------- */}
          {view.phase === "round-result" && (
            <RoundResult
              gameState={gameState}
              canNextRound={view.controls.canNextRound}
              onNextRound={() => actions.nextRound()}
              onReassign={(wordIndex, newWinnerIndex) => actions.reassignWord(wordIndex, newWinnerIndex)}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  titleContainer: { alignItems: "center" },
  content: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 60 },
  loadingText: { color: COLORS.textSecondary, marginTop: 14 }
});
