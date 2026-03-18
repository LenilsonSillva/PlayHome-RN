import { CryptoGameState } from "../../types/game";
import { getUniqueWord } from "../../logic/wordSelector";
import { GameAction } from "./types";

export function interceptionReducer(state: CryptoGameState | null, action: GameAction): CryptoGameState | null {
  if (!state || state.config.mode !== "interception") return state;

  switch (action.type) {
    case "INTERCEPTION_RESULT": {
      if (!("winnerTeamIndex" in action)) return state;

      // 🔥 1. Calcula os milissegundos exatos que o time demorou para responder
      const now = Date.now();
      const timeSpentOnWord = now - (state.lastActionTime || now);

      let updatedTeams = state.teams;

      if (action.winnerTeamIndex !== null) {
        updatedTeams = state.teams.map((t, i) => {
          if (i !== action.winnerTeamIndex) return t;

          // 🔥 2. Adiciona o acerto no currículo do Operador (Para o MVP!)
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
            operatorStats: opStats // Atualiza a pontuação individual dele!
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

      const nextWord = getUniqueWord(state.config.categories, state.usedWords);

      if (!nextWord) {
        return { ...state, phase: "round-result", roundEndTime: undefined, lastActionTime: undefined };
      }

      return {
        ...state,
        teams: updatedTeams,
        currentMatchIndex: nextMatchIndex,
        currentWord: nextWord,
        usedWords: [...state.usedWords, nextWord],
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
          // 🔥 3. Conta o "Passo" como um Erro para o cálculo de Eficiência do grupo
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