import type { GlobalPlayer } from "./player";

export type BaseGameData<TPlayer = GlobalPlayer> = {
  allPlayers: TPlayer[];
  selectedCategories?: string[];
  whoStart?: string;
};
