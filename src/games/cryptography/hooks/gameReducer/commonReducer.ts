import { createTeams } from "../../logic/createTeams";
import { getUniqueWord } from "../../logic/wordSelector";
import { CryptoGameState } from "../../types/game";
import { GameAction } from "./types";

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
        usedWords: action.globalUsedWords || [],
        roundNumber: 1,
        currentMatchIndex: 0,
        skipsLeft: MAX_SKIPS,
        roundEndTime: undefined,
        wordDatabase: action.wordDatabase || [],
        wordsLanguage: action.langCode || ""
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

      const firstWord = getUniqueWord(state.config.categories, state.usedWords, state.wordDatabase);

      return {
        ...state,
        phase: state.config.mode === "infiltration" ? "infiltration-action" : "interception-action",
        currentWord: firstWord.word,
        usedWords: firstWord.didReset ? [firstWord.word] : [...state.usedWords, firstWord.word],
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
      const nextWord = getUniqueWord(state.config.categories, state.usedWords, state.wordDatabase);
      if (!nextWord || !nextWord.word) return { ...state, phase: "round-result" };

      return {
        ...state,
        currentWord: nextWord.word,
        usedWords: nextWord.didReset ? [nextWord.word] : [...state.usedWords, nextWord.word]
      };
    }

    case "NEXT_ROUND": {
      if (!state) return state;

      let nextStartingTeam = state.startingTeamIndex;

      // 🔥 Lógica de transição de Rodadas
      if (state.config.mode === "infiltration") {
        // Infiltração: O próximo grupo na fila inicia a nova rodada (Rodízio padrão)
        nextStartingTeam = (state.startingTeamIndex + 1) % state.teams.length;
      } else {
        // 🔥 INTERCEPTAÇÃO: O Vencedor Absoluto da rodada anterior ganha o direito de iniciar.
        // Aplicamos a mesma Regra de Desempate Oficial da tela de resultados (Acertos -> Eficiência -> Tempo)
        const sortedTeams = [...state.teams].sort((a, b) => {
          // 1. Mais Acertos ganha
          if (a.roundScore !== b.roundScore) return b.roundScore - a.roundScore;

          // 2. Maior Eficiência ganha (Caso empatem nos acertos)
          const attemptsA = a.roundScore + (a.roundErrors || 0);
          const effA = attemptsA > 0 ? Math.round((a.roundScore / attemptsA) * 100) : 0;

          const attemptsB = b.roundScore + (b.roundErrors || 0);
          const effB = attemptsB > 0 ? Math.round((b.roundScore / attemptsB) * 100) : 0;

          if (effA !== effB) return effB - effA;

          // 3. Menor Tempo Médio ganha (Caso empatem nos acertos e na eficiência)
          const rawTimeA = a.roundScore > 0 ? (a.roundTimeSpent || 0) / a.roundScore : 0;
          const timeA = Number((rawTimeA / 1000).toFixed(1));

          const rawTimeB = b.roundScore > 0 ? (b.roundTimeSpent || 0) / b.roundScore : 0;
          const timeB = Number((rawTimeB / 1000).toFixed(1));

          if (timeA !== timeB) return timeA - timeB; // Menor tempo = melhor rank

          return 0; // Empate absoluto milimétrico
        });

        // Pega a equipe que ficou em 1º lugar na ordenação justa
        const trueWinnerId = sortedTeams[0].id;

        // Encontra o índice real dessa equipe no array principal
        nextStartingTeam = state.teams.findIndex((t) => t.id === trueWinnerId);
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
          roundErrors: 0, // Reseta pro relatório da nova rodada
          roundTimeSpent: 0 // Reseta pro relatório da nova rodada
        }))
      };
    }

    default:
      return state;
  }
}
