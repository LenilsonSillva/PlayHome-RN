import { CryptoGameState } from "../../types/game";
import { getUniqueWord } from "../../logic/wordSelector";
import { GameAction } from "./types";

export function infiltrationReducer(state: CryptoGameState | null, action: GameAction): CryptoGameState | null {
  if (!state || state.config.mode !== "infiltration") return state;

  switch (action.type) {
    case "INFILTRATION_WORD": {
      if (!("success" in action)) return state;

      const now = Date.now();
      const timeSpentOnWord = now - (state.lastActionTime || now);

      let newScore = 0;
      let newErrors = 0;
      let newWords: string[] = [];
      let newSkips = state.skipsLeft;

      if (action.success) {
        newScore = 1;
        if (state.currentWord) newWords.push(state.currentWord);
      } else {
        if (state.config.skipLimit !== 999) {
          if (state.skipsLeft === 0) return state; // Bloqueia o pulo se acabou
          newSkips = state.skipsLeft - 1;
        }
        // Se for 999, newSkips continua sendo 999 e o erro é contado
        newErrors = 1;
      }

      const updatedTeams = state.teams.map((t, i) => {
        if (i !== state.currentTeamIndex) return t;

        const opStats = { ...t.operatorStats };
        if (action.success && t.operatorId) {
          opStats[t.operatorId] = (opStats[t.operatorId] || 0) + 1;
        }

        return {
          ...t,
          score: t.score + newScore,
          roundScore: t.roundScore + newScore,
          wordsGuessed: [...t.wordsGuessed, ...newWords],
          roundErrors: t.roundErrors + newErrors,
          totalErrors: t.totalErrors + newErrors,
          roundTimeSpent: t.roundTimeSpent + timeSpentOnWord,
          totalTimeSpent: t.totalTimeSpent + timeSpentOnWord,
          operatorStats: opStats
        };
      });

      const newHistoryItem = {
        word: state.currentWord!,
        winnerTeamIndex: action.success ? state.currentTeamIndex : null,
        ownerTeamIndex: state.currentTeamIndex
      };

      const historyWithCurrentWord = [...state.roundHistory, newHistoryItem];

      const result = getUniqueWord(state.config.categories, state.usedWords, state.wordDatabase);

      if (!result.word) {
        return {
          ...state,
          teams: updatedTeams,
          phase: "round-result",
          roundEndTime: undefined,
          lastActionTime: undefined,
          roundHistory: historyWithCurrentWord
        };
      }

      return {
        ...state,
        teams: updatedTeams,
        currentWord: result.word,
        usedWords: result.didReset ? [result.word] : [...state.usedWords, result.word],
        skipsLeft: newSkips,
        lastActionTime: now,
        roundHistory: historyWithCurrentWord
      };
    }

    case "FINISH_INFILTRATION_TURN": {
      const nextTeamIndex = (state.currentTeamIndex + 1) % state.teams.length;
      const isLastTeam = nextTeamIndex === state.startingTeamIndex;
      const currentHistoryItem = {
        word: state.currentWord!,
        winnerTeamIndex: null,
        ownerTeamIndex: state.currentTeamIndex
      };

      if (isLastTeam) {
        return {
          ...state,
          phase: "round-result",
          roundEndTime: undefined,
          lastActionTime: undefined,
          roundHistory: [...state.roundHistory, currentHistoryItem]
        };
      }

      const result = getUniqueWord(state.config.categories, state.usedWords, state.wordDatabase);

      if (!result.word) {
        return {
          ...state,
          phase: "round-result",
          roundEndTime: undefined,
          lastActionTime: undefined,
          roundHistory: [...state.roundHistory, currentHistoryItem]
        };
      }

      return {
        ...state,
        currentTeamIndex: nextTeamIndex,
        currentWord: result.word,
        usedWords: result.didReset ? [result.word] : [...state.usedWords, result.word],
        skipsLeft: state.config.skipLimit,
        roundEndTime: undefined,
        lastActionTime: undefined,
        roundHistory: [...state.roundHistory, currentHistoryItem]
      };
    }

    default:
      return state;
  }
}
