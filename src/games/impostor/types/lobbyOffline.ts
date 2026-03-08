import type { ImpostorPlayer } from "./game";

// Configurações definidas pelo host antes de iniciar
export type LobbyConfig = {
  impostorCount: number;
  twoWordsMode: boolean;
  impostorHasHint: boolean;
  impostorCanStart: boolean;
  selectedCategories: string[];
  whoStartButton: boolean;
  impostorTrap: boolean;
  impostorCat: boolean;
};

// Estado do lobby offline
export type LobbyState = {
  players: ImpostorPlayer[];
  config: LobbyConfig;
};
