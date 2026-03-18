import { TEAM_NAMES, TEAM_COLORS } from "../constants/teams";
import { shuffleArray } from "@/games/common/utils/array";
import { CryptoPlayer, CryptoTeam } from "../types/game";
import { PLAYER_COLORS } from "@/games/common/constants/colors"; // 🔥 Import da paleta de cores

export function createTeams(
  players: CryptoPlayer[],
  numberOfTeams: number,
  distributionType: "random" | "manual",
  manualAssignments?: Record<string, number> // { "idDoJogador": 0 (index do time) }
): CryptoTeam[] {
  // 1. Inicializa os Esquadrões Vazios
  const teams: CryptoTeam[] = Array.from({ length: numberOfTeams }).map((_, i) => ({
    id: `team-${i}`,
    name: TEAM_NAMES[i],
    color: TEAM_COLORS[i],
    operatorId: null,
    players: [],
    score: 0,
    roundScore: 0,
    wordsGuessed: [],
    roundErrors: 0,
    totalErrors: 0,
    roundTimeSpent: 0,
    totalTimeSpent: 0,
    operatorStats: {}
  }));

  // 🔥 2. Atribui Cores Únicas e Aleatórias aos Jogadores
  const shuffledColors = shuffleArray([...PLAYER_COLORS]);
  const coloredPlayers = players.map((p, index) => ({
    ...p,
    color: shuffledColors[index % shuffledColors.length]
  }));

  // 3. Distribui os Jogadores (já com suas cores)
  if (distributionType === "random") {
    const shuffled = shuffleArray([...coloredPlayers]);
    shuffled.forEach((player, index) => {
      const teamIndex = index % numberOfTeams; // Distribuição igualitária (cartas de baralho)
      teams[teamIndex].players.push({ ...player, teamId: teams[teamIndex].id });
    });
  } else if (manualAssignments) {
    coloredPlayers.forEach((player) => {
      const teamIndex = manualAssignments[player.id] || 0; // Fallback pro time 0 se der erro
      teams[teamIndex].players.push({ ...player, teamId: teams[teamIndex].id });
    });
  }

  return teams;
}
