import { CryptoConfig, CryptoPlayer } from "../../types/game";

export type GameAction =
  // Ações Comuns
  | {
      type: "START_GAME";
      players: CryptoPlayer[];
      config: CryptoConfig;
      manualAssignments?: Record<string, number>;
      globalUsedWords: string[];
      wordDatabase?: any[];
      langCode?: string;
    }
  | { type: "SET_OPERATOR"; teamId: string; playerId: string }
  | { type: "SET_STARTING_TEAM"; teamIndex: number }
  | { type: "SET_RANDOM_OPERATORS" }
  | { type: "BEGIN_ACTION_PHASE" }
  | { type: "START_TIMER" }
  | { type: "REROLL_WORD" }
  | { type: "REASSIGN_WORD"; wordIndex: number; newWinnerIndex: number | null }
  | { type: "NEXT_ROUND" }
  | { type: "QUIT_GAME" }
  // Ações Infiltração
  | { type: "INFILTRATION_WORD"; success: boolean }
  | { type: "FINISH_INFILTRATION_TURN" }
  // Ações Interceptação
  | { type: "INTERCEPTION_RESULT"; winnerTeamIndex: number | null }
  | { type: "PASS_INTERCEPTION_TURN" };
