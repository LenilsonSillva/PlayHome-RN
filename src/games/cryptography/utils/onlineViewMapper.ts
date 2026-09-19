import type { CryptoGameState, CryptoTeam } from "../types/game";
import type { CryptoView } from "../types/online";

// ============================================================
// Converte a `CryptoView` do servidor (personalizada por
// jogador) em um `CryptoGameState` compatível com as telas
// offline: TeamRevealPhase, InfiltrationAction,
// InterceptionAction e RoundResult.
//
// O servidor já envia `currentWord` = null quando o jogador
// não tem permissão de vê-la — nada "vaza" na conversão.
// ============================================================
// ------------------------------------------------------------
// Diferença de relógio entre o aparelho e o servidor, medida no
// momento em que a view chega (mesmo padrão do Impostor online,
// ver VotingPhase: `data.serverTime - Date.now()`). Os
// cronômetros exibem `roundEndTime - (Date.now() + offset)` —
// o FIM continua sendo decidido pelo servidor, só a exibição
// passa a estar sincronizada.
// ------------------------------------------------------------
export function serverTimeOffset(serverTime?: number | null): number {
  return serverTime ? serverTime - Date.now() : 0;
}

export function viewToGameState(view: CryptoView): CryptoGameState {
  return {
    config: {
      mode: view.config.mode,
      teamCount: view.config.teamCount,
      distributionType: view.config.distributionType,
      roundTime: view.config.roundTime,
      wordLimit: view.config.wordLimit,
      skipLimit: view.config.skipLimit,
      categories: view.config.categories,
    },
    phase: view.phase,
    teams: view.teams.map<CryptoTeam>((team) => ({
      id: team.id,
      name: team.name,
      color: team.color,
      operatorId: team.operatorId,
      players: team.players.map((p) => ({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        color: p.color
      })),
      score: team.score,
      roundScore: team.roundScore,
      wordsGuessed: team.wordsGuessed,
      roundErrors: team.roundErrors,
      totalErrors: team.totalErrors,
      roundTimeSpent: team.roundTimeSpent,
      totalTimeSpent: team.totalTimeSpent,
      operatorStats: team.operatorStats,
      // Campos só usados no modo offline (ajustes manuais)
      manualAdjustmentCount: 0,
      manualAdjustmentAddCount: 0,
      manualAdjustmentRemoveCount: 0,
      // Personalizado pelo servidor: host ou subHost do próprio grupo
      canSetOperator: team.canSetOperator
    })),
    currentTeamIndex: view.currentTeamIndex,
    startingTeamIndex: view.startingTeamIndex,
    currentWord: view.currentWord, // null quando oculta para este jogador
    usedWords: [],
    roundNumber: view.roundNumber,
    currentMatchIndex: view.currentMatchIndex,
    skipsLeft: view.skipsLeft,
    roundEndTime: view.roundEndTime ?? undefined,
    lastActionTime: view.lastActionTime ?? undefined,
    wordDatabase: [],
    wordsLanguage: view.config.language,
    roundHistory: view.roundHistory
  };
}