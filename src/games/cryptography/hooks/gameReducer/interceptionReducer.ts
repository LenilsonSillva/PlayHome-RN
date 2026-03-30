import { CryptoGameState } from "../../types/game";
import { getUniqueWord } from "../../logic/wordSelector";
import { GameAction } from "./types";

export function interceptionReducer(state: CryptoGameState | null, action: GameAction): CryptoGameState | null {
  if (!state || state.config.mode !== "interception") return state;

  switch (action.type) {
    case "INTERCEPTION_RESULT": {
      if (!("winnerTeamIndex" in action)) return state;

      const now = Date.now();
      const timeSpentOnWord = now - (state.lastActionTime || now);

      let updatedTeams = state.teams;

      if (action.winnerTeamIndex !== null) {
        updatedTeams = state.teams.map((t, i) => {
          if (i !== action.winnerTeamIndex) return t;

          const opStats = { ...t.operatorStats };
          if (t.operatorId) {
            opStats[t.operatorId] = (opStats[t.operatorId] || 0) + 1;
          }

          return {
            ...t,
            score: t.score + 1,
            roundScore: t.roundScore + 1,
            wordsGuessed: state.currentWord ? [...t.wordsGuessed, state.currentWord] : t.wordsGuessed,
            roundTimeSpent: t.roundTimeSpent + timeSpentOnWord,
            totalTimeSpent: t.totalTimeSpent + timeSpentOnWord,
            operatorStats: opStats
          };
        });
      }

      const nextMatchIndex = state.currentMatchIndex + 1;
      const isRoundOver = nextMatchIndex >= state.config.wordLimit;
      const newCurrentTeamIndex = action.winnerTeamIndex !== null ? action.winnerTeamIndex : state.currentTeamIndex;

      if (isRoundOver) {
        return {
          ...state,
          teams: updatedTeams,
          phase: "round-result",
          currentTeamIndex: newCurrentTeamIndex,
          roundEndTime: undefined,
          lastActionTime: undefined
        };
      }

      const result = getUniqueWord(state.config.categories, state.usedWords, state.wordDatabase);

      if (!result.word) {
        return { ...state, phase: "round-result", roundEndTime: undefined, lastActionTime: undefined };
      }

      return {
        ...state,
        teams: updatedTeams,
        currentMatchIndex: nextMatchIndex,
        currentWord: result.word,
        usedWords: result.didReset ? [result.word] : [...state.usedWords, result.word],
        currentTeamIndex: newCurrentTeamIndex,
        roundEndTime: undefined,
        lastActionTime: undefined
      };
    }

    case "PASS_INTERCEPTION_TURN": {
      const now = Date.now();
      const timeSpentOnTurn = now - (state.lastActionTime || now);

      const updatedTeams = state.teams.map((t, i) => {
        if (i !== state.currentTeamIndex) return t;

        return {
          ...t,
          roundErrors: t.roundErrors + 1,
          totalErrors: t.totalErrors + 1,
          roundTimeSpent: t.roundTimeSpent + timeSpentOnTurn,
          totalTimeSpent: t.totalTimeSpent + timeSpentOnTurn
        };
      });

      return {
        ...state,
        teams: updatedTeams,
        currentTeamIndex: (state.currentTeamIndex + 1) % state.teams.length,
        roundEndTime: undefined,
        lastActionTime: undefined
      };
    }

    default:
      return state;
  }
}
