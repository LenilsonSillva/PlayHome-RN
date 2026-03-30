import { WordData } from "@/games/common/data/words/types";

/**
 * Jogador do jogo Impostor
 * Combina informações pessoais com status do jogo
 */
export type ImpostorPlayer = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isImpostor: boolean;
  isAlive: boolean;
  word: string | null;
  hint?: string;
  /** Pontos obtidos NA RODADA ATUAL (pode ser positivo ou negativo) */
  score: number;
  /** Acumulação histórica de pontos (resultado permanente) */
  globalScore: number;
  isHost?: boolean;
  vote?: string;
  ready?: boolean;
  revealed?: boolean;
  socketId?: string;
  voted?: boolean;
};

/**
 * Estado completo de uma partida Impostor
 */
export type ImpostorGame = {
  players: ImpostorPlayer[];
  impostorCount: number;
  twoWordsMode: boolean;
  impostorHasHint: boolean;
  impostorCanStart: boolean;
  impostorsUnited: boolean;
  selectedCategories: string[];
  chosenWord: string[];
  whoStart?: string;
  phase: "discussion" | "voting" | "reveal" | "elimination" | "result";
  impostorHistory: string[][];
  usedWords: string[];
  word?: string;
  wordsLanguage: string;
  impostorTrap: boolean;
  impostorCat: boolean;
  didReset?: boolean;
  activeWordList?: WordData[]; 
};

/**
 * Dados específicos do jogador online durante o jogo
 * Estende ImpostorGame com dados personalizados
 *
 * ⚠️ IMPORTANTE:
 * - `isSpectator = true`: Você está observando (entrou após jogo começar)
 * - `isHost`: Você pode controlar configurações/próxima rodada
 * - `isImpostor`: Seu role no jogo
 */
export type OnlineImpostorGame = ImpostorGame & {
  /** Todos os jogadores dessa partida (participantes + espectadores que viraram jogadores) */
  allPlayers: ImpostorPlayer[];
  isHost: boolean;
  isImpostor: boolean;
  myColor: string;
  myEmoji: string;
  myName: string;
  ready: boolean;
  isAlive: boolean;
  revealed: boolean;
  roomCode: string;
  voted: boolean;
  votes: Record<string, string | null>;
  votingFinished?: boolean;
  /** True se você entrou em jogo já em andamento (espectador) */
  isSpectator?: boolean;
  word: string | null;
  hint: string;
  /** Pontos obtidos NA RODADA ATUAL (pode ser positivo ou negativo) */
  score: number;
  /** Acumulação histórica de pontos (resultado permanente) */
  globalScore: number;
  eliminatedId?: string | null;
};
