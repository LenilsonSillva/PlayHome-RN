import { CryptoGameState } from "../../types/game";
import { getUniqueWord } from "../../logic/wordSelector";
import { GameAction } from "./types";

const MAX_SKIPS = 3;

export function infiltrationReducer(state: CryptoGameState | null, action: GameAction): CryptoGameState | null {
  if (!state || state.config.mode !== "infiltration") return state;

  switch (action.type) {
    case "INFILTRATION_WORD": {
      if (!("success" in action)) return state;

      // 🔥 1. Calcula o tempo exato neste Swipe
      const now = Date.now();
      const timeSpentOnWord = now - (state.lastActionTime || now);

      let newScore = 0;
      let newErrors = 0;
      let newWords: string[] =[];
      let newSkips = state.skipsLeft;

      if (action.success) {
        newScore = 1;
        if (state.currentWord) newWords.push(state.currentWord);
      } else {
        if (state.skipsLeft === 0) return state;
        newSkips = state.skipsLeft - 1;
        newErrors = 1; // Registra o pulo como erro
      }

      const updatedTeams = state.teams.map((t, i) => {
        if (i !== state.currentTeamIndex) return t;

        // 🔥 2. Adiciona o acerto no currículo do Operador
        const opStats = { ...t.operatorStats };
        if (action.success && t.operatorId) {
          opStats[t.operatorId] = (opStats[t.operatorId] || 0) + 1;
        }

        return {
          ...t,
          score: t.score + newScore,
          roundScore: t.roundScore + newScore,
          wordsGuessed:[...t.wordsGuessed, ...newWords],
          roundErrors: t.roundErrors + newErrors,
          totalErrors: t.totalErrors + newErrors,
          roundTimeSpent: t.roundTimeSpent + timeSpentOnWord,
          totalTimeSpent: t.totalTimeSpent + timeSpentOnWord,
          operatorStats: opStats
        };
      });

      const nextWord = getUniqueWord(state.config.categories, state.usedWords);

      if (!nextWord) {
        return {
          ...state,
          teams: updatedTeams,
          phase: "round-result",
          roundEndTime: undefined,
          lastActionTime: undefined
        };
      }

      return {
        ...state,
        teams: updatedTeams,
        currentWord: nextWord,
        usedWords: [...state.usedWords, nextWord],
        skipsLeft: newSkips,
        lastActionTime: now // Reinicia o relógio pro próximo swipe
      };
    }

    case "FINISH_INFILTRATION_TURN": {
      const isLastTeam = state.currentTeamIndex >= state.teams.length - 1;

      if (isLastTeam) {
        return { ...state, phase: "round-result", roundEndTime: undefined, lastActionTime: undefined };
      }

      const nextTeamIndex = state.currentTeamIndex + 1;
      const nextWord = getUniqueWord(state.config.categories, state.usedWords);

      if (!nextWord) {
        return { ...state, phase: "round-result", roundEndTime: undefined, lastActionTime: undefined };
      }

      return {
        ...state,
        currentTeamIndex: nextTeamIndex,
        currentWord: nextWord,
        usedWords: [...state.usedWords, nextWord],
        skipsLeft: MAX_SKIPS,
        roundEndTime: undefined,
        lastActionTime: undefined // O próximo time que começa do zero ao dar o play
      };
    }

    default:
      return state;
  }
}