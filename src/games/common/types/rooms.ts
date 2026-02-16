import type { GlobalPlayer } from "./player";

export type BaseRoom<TPlayer = GlobalPlayer> = {
  code: string;
  hostId: string;
  players: TPlayer[];
  gameState: "waiting" | "playing" | "ended";
  gameType: string; // ex: "impostor", "criptografia"
  createdAt: number;
};
