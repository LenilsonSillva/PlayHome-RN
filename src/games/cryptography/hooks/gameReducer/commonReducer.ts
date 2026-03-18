import { createTeams } from "../../logic/createTeams";
import { getUniqueWord } from "../../logic/wordSelector";
import { CryptoGameState } from "../../types/game";
import { GameAction } from "./types";
import { PLAYER_COLORS } from "@/games/common/constants/colors";

const MAX_SKIPS = 3;

export function commonReducer(state: CryptoGameState | null, action: GameAction): CryptoGameState | null {
  switch (action.type) {
    case "START_GAME": {
      const teams = createTeams(
        action.players,
        action.config.teamCount,
        action.config.distributionType,
        action.manualAssignments
      );

      const initialTeamIndex = Math.floor(Math.random() * teams.length);

      return {
        config: action.config,
        phase: "team-reveal",
        teams,
        currentTeamIndex: initialTeamIndex, // Equipe ativa
        startingTeamIndex: initialTeamIndex, // Equipe que abriu a rodada
        currentWord: null,
        usedWords: [],
        roundNumber: 1,
        currentMatchIndex: 0,
        skipsLeft: MAX_SKIPS,
        roundEndTime: undefined
      };
    }

    case "SET_OPERATOR": {
      if (!state) return state;
      const updatedTeams = state.teams.map((t) => (t.id === action.teamId ? { ...t, operatorId: action.playerId } : t));
      return { ...state, teams: updatedTeams };
    }

    case "SET_STARTING_TEAM": {
      if (!state) return state;
      return {
        ...state,
        currentTeamIndex: action.teamIndex,
        startingTeamIndex: action.teamIndex,
        teams: [...state.teams]
      };
    }

    case "SET_RANDOM_OPERATORS": {
      if (!state) return state;
      const updatedTeams = state.teams.map((t) => {
        if (t.players.length === 0) return t;
        const randomPlayer = t.players[Math.floor(Math.random() * t.players.length)];
        return { ...t, operatorId: randomPlayer.id };
      });
      return { ...state, teams: updatedTeams };
    }

    case "BEGIN_ACTION_PHASE": {
      if (!state) return state;

      const hasMissingOperator = state.teams.some((t) => !t.operatorId);
      if (hasMissingOperator) return state;

      const firstWord = getUniqueWord(state.config.categories, state.usedWords);

      return {
        ...state,
        phase: state.config.mode === "infiltration" ? "infiltration-action" : "interception-action",
        currentWord: firstWord,
        usedWords: [...state.usedWords, firstWord],
        skipsLeft: MAX_SKIPS,
        roundEndTime: undefined,
        // 🔥 CORRIGIDO: Limpa os scores apenas se for o primeiro turno da primeira rodada
        // indepedente de qual grupo for o "Grupo 0"
        teams:
          state.roundNumber === 1 && state.currentTeamIndex === state.startingTeamIndex
            ? state.teams.map((t) => ({ ...t, roundScore: 0 }))
            : state.teams
      };
    }

    case "START_TIMER": {
      if (!state) return state;

      // evita iniciar duas vezes
      if (state.roundEndTime !== undefined) return state;

      return {
        ...state,
        roundEndTime: Date.now() + state.config.roundTime * 1000,
        lastActionTime: Date.now() // 🔥 Começa a cronometrar a 1ª palavra aqui!
      };
    }

    case "REROLL_WORD": {
      if (!state) return state;
      const nextWord = getUniqueWord(state.config.categories, state.usedWords);
      if (!nextWord) return { ...state, phase: "round-result" };

      return {
        ...state,
        currentWord: nextWord,
        usedWords: [...state.usedWords, nextWord]
      };
    }

    case "NEXT_ROUND": {
      if (!state) return state;

      let nextStartingTeam = state.startingTeamIndex;

      // 🔥 2. Lógica matemática de transição de Rodadas
      if (state.config.mode === "infiltration") {
        nextStartingTeam = (state.startingTeamIndex + 1) % state.teams.length;
      } else {
        // 🔥 CORREÇÃO: Interceptação - O vencedor APENAS DA RODADA ANTERIOR ganha o direito de iniciar!
        // Procuramos o time com o maior 'roundScore'
        let maxRoundScore = -1;
        let roundWinnerIndex = state.startingTeamIndex; 

        state.teams.forEach((t, idx) => {
          if (t.roundScore > maxRoundScore) {
            maxRoundScore = t.roundScore;
            roundWinnerIndex = idx;
          }
        });
        nextStartingTeam = roundWinnerIndex;
      }

      return {
        ...state,
        phase: "team-reveal",
        currentTeamIndex: nextStartingTeam,
        startingTeamIndex: nextStartingTeam,
        currentMatchIndex: 0,
        roundNumber: state.roundNumber + 1,
        roundEndTime: undefined,
        lastActionTime: undefined,
        teams: state.teams.map((t) => ({
          ...t,
          operatorId: null,
          roundScore: 0,
          roundErrors: 0, // 🔥 Reseta pro relatório da nova rodada
          roundTimeSpent: 0 // 🔥 Reseta pro relatório da nova rodada
        }))
      };
    }

    default:
      return state;
  }
}
