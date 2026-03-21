import { useReducer, useCallback, useEffect } from "react";
import { gameReducer } from "./gameReducer";
import { CryptoConfig, CryptoPlayer } from "../types/game";
import { saveGlobalUsedWords } from "@/games/common/utils/wordStorage";

export function useOfflineCryptography() {
  const [gameState, dispatch] = useReducer(gameReducer, null);

  const persistWords = useCallback(() => {
    if (gameState?.usedWords && gameState.usedWords.length > 0) {
      saveGlobalUsedWords(gameState.usedWords);
    }
  }, [gameState?.usedWords]);

  // Salva automaticamente quando a rodada acaba
  useEffect(() => {
    if (gameState?.phase === "round-result") {
      persistWords();
    }
  }, [gameState?.phase, persistWords]);

  const startGame = useCallback(
    (
      players: CryptoPlayer[],
      config: CryptoConfig,
      manualAssignments?: Record<string, number>,
      globalUsedWords: string[] = []
    ) => {
      dispatch({ type: "START_GAME", players, config, manualAssignments, globalUsedWords });
    },
    []
  );

  const setOperator = useCallback((teamId: string, playerId: string) => {
    dispatch({ type: "SET_OPERATOR", teamId, playerId });
  }, []);

  const setStartingTeam = useCallback((teamIndex: number) => {
    dispatch({ type: "SET_STARTING_TEAM", teamIndex });
  }, []);

  const setRandomOperators = useCallback(() => {
    dispatch({ type: "SET_RANDOM_OPERATORS" });
  }, []);

  const beginActionPhase = useCallback(() => {
    dispatch({ type: "BEGIN_ACTION_PHASE" });
  }, []);

  const startTimer = useCallback(() => {
    dispatch({ type: "START_TIMER" });
  }, []);

  const handleInfiltrationWord = useCallback((success: boolean) => {
    dispatch({ type: "INFILTRATION_WORD", success });
  }, []);

  const finishInfiltrationTurn = useCallback(() => {
    dispatch({ type: "FINISH_INFILTRATION_TURN" });
  }, []);

  const handleInterceptionResult = useCallback((winnerTeamIndex: number | null) => {
    dispatch({ type: "INTERCEPTION_RESULT", winnerTeamIndex });
  }, []);

  const passInterceptionTurn = useCallback(() => {
    dispatch({ type: "PASS_INTERCEPTION_TURN" });
  }, []);

  const rerollWord = useCallback(() => {
    dispatch({ type: "REROLL_WORD" });
  }, []);

  const nextRound = useCallback(() => {
    dispatch({ type: "NEXT_ROUND" });
  }, []);

  const quitGame = useCallback(() => {
    persistWords(); // 👈 Salva antes de limpar o estado
    dispatch({ type: "QUIT_GAME" });
  }, [persistWords]);

  return {
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
    persistWords,
    quitGame
  };
}
