import { BaseRoom } from "@/games/common/types/rooms";
import type { ImpostorPlayer } from "./game";

export type ImpostorRoom = BaseRoom<ImpostorPlayer> & {
  impostorHistory: string[][];
  usedWords: string[];
  phase: "reveal" | "discussion" | "voting" | "elimination" | "result";
};
