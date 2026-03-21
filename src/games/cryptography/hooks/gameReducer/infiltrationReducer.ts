import { CryptoGameState } from "../../types/game";
import { getUniqueWord } from "../../logic/wordSelector";
import { GameAction } from "./types";

const MAX_SKIPS = 3;

export function infiltrationReducer(state: CryptoGameState | null, action: GameAction): CryptoGameState | null {
  if (!state || state.config.mode !== "infiltration") return state;

  switch (action.type) {
    case "INFILTRATION_WORD": {
      if (!("success" in action)) return state;

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
          wordsGuessed:[...t.wordsGuessed, ...newWords],
          roundErrors: t.roundErrors + newErrors,
          totalErrors: t.totalErrors + newErrors,
          roundTimeSpent: t.roundTimeSpent + timeSpentOnWord,
          totalTimeSpent: t.totalTimeSpent + timeSpentOnWord,
          operatorStats: opStats
        };
      });

      // 🔥 CORREÇÃO: Lê o 'result.word' do novo formato
      const result = getUniqueWord(state.config.categories, state.usedWords);

      if (!result.word) {
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
        currentWord: result.word,
        // 🔥 Se o banco zerou (didReset), a lista de usadas começa limpa só com essa palavra!
        usedWords: result.didReset ? [result.word] : [...state.usedWords, result.word],
        skipsLeft: newSkips,
        lastActionTime: now
      };
    }

    case "FINISH_INFILTRATION_TURN": {
      const nextTeamIndex = (state.currentTeamIndex + 1) % state.teams.length;
      const isLastTeam = nextTeamIndex === state.startingTeamIndex;

      if (isLastTeam) {
        return { ...state, phase: "round-result", roundEndTime: undefined, lastActionTime: undefined };
      }

      const result = getUniqueWord(state.config.categories, state.usedWords);

      if (!result.word) {
        return { ...state, phase: "round-result", roundEndTime: undefined, lastActionTime: undefined };
      }

      return {
        ...state,
        currentTeamIndex: nextTeamIndex,
        currentWord: result.word,
        usedWords: result.didReset ? [result.word] : [...state.usedWords, result.word],
        skipsLeft: MAX_SKIPS,
        roundEndTime: undefined,
        lastActionTime: undefined
      };
    }

    default:
      return state;
  }
}