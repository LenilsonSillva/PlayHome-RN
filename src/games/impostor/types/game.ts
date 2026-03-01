import { OnlinePlayer } from "@/games/common/types/player";

// Jogador do Impostor
export type ImpostorPlayer = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isImpostor: boolean;
  isAlive: boolean;
  word: string | null;
  hint?: string;
  score: number;
  globalScore: number;
  isHost?: boolean,
  vote?: string;
  ready?: boolean;
  revealed?: boolean;
  socketId?: string;
  voted?: boolean;
};

export type ImpostorGame = {
  players: ImpostorPlayer[];
  impostorCount: number;
  twoWordsMode: boolean;
  impostorHasHint: boolean;
  impostorCanStart: boolean;
  selectedCategories: string[];
  chosenWord: string[];
  whoStart?: string;
  phase: "discussion" | "voting" | "reveal" | "elimination" | "result"; // fases do jogo
  impostorHistory: string[][]; // histórico de quem foi impostor
  usedWords: string[];         // palavras já usadas
  word?: string
};

export type OnlineImpostorGame = ImpostorGame & {
  allPlayers: OnlinePlayer;
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
  votes: Record<string, string | null >;
  votingFinished?: boolean;
  isSpectator?: boolean;
  word: string | null;
  hint: string;
  score: number;
  globalScore: number;
  eliminatedId?: string | null;
}