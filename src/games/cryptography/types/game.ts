import { GlobalPlayer } from "@/games/common/types/player";

export type CryptoMode = "infiltration" | "interception";

export type CryptoPhase =
  | "lobby"
  | "team-reveal"
  | "infiltration-action"
  | "interception-action"
  | "round-result"
  | "final-result";

export interface CryptoPlayer extends GlobalPlayer {
  teamId?: string;
}

export interface CryptoTeam {
  id: string;
  name: string;
  color: string;
  operatorId: string | null; // Null até que seja escolhido no TeamReveal
  players: CryptoPlayer[];
  score: number;
  roundScore: number;
  wordsGuessed: string[];
  roundErrors: number;
  totalErrors: number; // Soma de pulos e erros
  roundTimeSpent: number; // Tempo em milissegundos
  totalTimeSpent: number; // Tempo total gasto (em milissegundos)
  operatorStats: Record<string, number>; // Ex: { "id_do_lucas": 14 }
}

export interface CryptoConfig {
  mode: CryptoMode;
  teamCount: number;
  distributionType: "random" | "manual";
  roundTime: number; // Infiltration (60, 90, 120) ou Interception (15, 30, 60)
  wordLimit: number; // Interception (5, 10, 20)
  categories: string[];
}

export interface CryptoGameState {
  config: CryptoConfig;
  phase: CryptoPhase;
  teams: CryptoTeam[];
  currentTeamIndex: number;
  startingTeamIndex: number;
  currentWord: string | null;
  usedWords: string[];
  roundNumber: number;
  currentMatchIndex: number; // Usado para a contagem de palavras do modo Interception
  skipsLeft: number; // Controle de pulos do modo Infiltration (Começa sempre em 3)
  roundEndTime?: number; // 🔥 NOVO: Timestamp de fim do turno para o Timer Seguro
  lastActionTime?: number; // 🔥 NOVO: Marca a hora em que a palavra apareceu na tela
  wordDatabase: any[]; // Banco de palavras travado para o jogo
  wordsLanguage: string; // Idioma do jogo travado
}
