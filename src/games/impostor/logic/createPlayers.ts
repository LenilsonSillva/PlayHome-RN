import type { GlobalPlayer } from "../../common/types/player";
import type { ImpostorPlayer } from "../types/game";
import { shuffleArray } from "../../common/utils/array";
import { PLAYER_ICONS } from "../constants/icons";
import { ICON_COLORS } from "../constants/colors";
import { pickImpostors } from "./pickImpostor";

export function createImpostorPlayers(
  players: GlobalPlayer[],
  impostorNumber: number,
  impostorHistory: string[][] = []
): ImpostorPlayer[] {
  const impostorIds = pickImpostors(players, impostorNumber, impostorHistory);
  const shuffledIcons = shuffleArray([...PLAYER_ICONS]);
  const shuffledColors = shuffleArray([...ICON_COLORS]);

  return players.map((p, index) => {
    return {
      ...p,
      isImpostor: impostorIds.includes(p.id),
      isAlive: true,
      word: null,
      score: 0, // Nova rodada começa com score zerado
      globalScore: p.globalScore ?? 0, // Mantém histórico de rodadas anteriores
      emoji: p.emoji ?? shuffledIcons[index % shuffledIcons.length],
      color: p.color ?? shuffledColors[index % shuffledColors.length],
    };
  });
}
