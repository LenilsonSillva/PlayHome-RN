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
};
