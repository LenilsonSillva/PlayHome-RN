import type { GlobalPlayer } from "../../common/types/player";
import { shuffleArray } from "../../common/utils/array";

// Função para sortear impostores respeitando histórico de consecutivos
export function pickImpostors(
  players: GlobalPlayer[],
  howManyImpostor: number,
  impostorHistory: string[][] = [],
  maxConsecutive = 2
): string[] {
  const consecutiveCount: Record<string, number> = {};
  players.forEach(p => (consecutiveCount[p.id] = 0));

  for (let i = impostorHistory.length - 1; i >= 0; i--) {
    const round = impostorHistory[i];
    let someoneBroke = false;
    players.forEach(p => {
      if (round.includes(p.id)) consecutiveCount[p.id]++;
      else consecutiveCount[p.id] = 0;
      if (consecutiveCount[p.id] >= maxConsecutive) someoneBroke = true;
    });
    if (someoneBroke) break;
  }

  const blockedIds = players
    .filter(p => consecutiveCount[p.id] >= maxConsecutive)
    .map(p => p.id);

  let pool = players.filter(p => !blockedIds.includes(p.id));
  if (pool.length < howManyImpostor) pool = [...players];

  return shuffleArray(pool).slice(0, howManyImpostor).map(p => p.id);
}