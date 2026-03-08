/**
 * Utilities para cálculo de pontuação do jogo Impostor
 * Centraliza a lógica (offline e online) para evitar gambiarras e inconsistências
 * 
 * CONVENÇÃO DE CAMPOS:
 * - score: pontos obtidos NA RODADA ATUAL (pode ser positivo ou negativo)
 * - globalScore: acumulação histórica de pontos (resultado permanente)
 */

import type { ImpostorPlayer } from "../types/game";

/**
 * Calcula os pontos de uma rodada individual para um jogador
 * 
 * Fórmula:
 * - Impostor vivo: +2
 * - Impostor morto: -1.5
 * - Civil vivo: +1
 * - Civil morto: 0
 * 
 * @param player - Jogador a calcular
 * @returns Pontos da rodada (pode ser negativo)
 */
export function getRoundPoints(player: ImpostorPlayer): number {
  if (player.isImpostor) {
    return player.isAlive ? 2 : -1.5;
  }
  return player.isAlive ? 1 : 0;
}

/**
 * Calcula e aplica os scores finais quando o jogo acaba
 * Usa a função getRoundPoints para consistência
 * 
 * @param players - Array de jogadores
 * @param isGameOver - Se o jogo acabou (para lógica futura se houver diferença)
 */
export function calculateAndApplyScores(
  players: ImpostorPlayer[],
  isGameOver: boolean = true
): ImpostorPlayer[] {
  return players.map((player) => {
    const roundPoints = getRoundPoints(player);
    return {
      ...player,
      score: roundPoints,
      globalScore: (player.globalScore || 0) + roundPoints
    };
  });
}

/**
 * Reseta os scores para uma nova rodada
 * Define score = 0 e mantém globalScore (acumulado)
 * Também reseta outros flags de fase
 * 
 * @param players - Array de jogadores
 */
export function resetScoresForNewRound(players: ImpostorPlayer[]): ImpostorPlayer[] {
  return players.map((p) => ({
    ...p,
    score: 0,
    voted: false,
    revealed: false,
    ready: false,
    isAlive: true
    // globalScore é MANTIDO (acumulativo)
  }));
}

/**
 * Formata um score para exibição na UI
 * Ex: 2 -> "+2", -1.5 -> "-1.5", 0 -> "-"
 * 
 * @param score - Score a formatar
 * @returns String formatada para UI
 */
export function formatScoreDisplay(score: number | undefined): string {
  if (score === undefined || score === 0) return "-";
  return score > 0 ? `+${score}` : String(score);
}

/**
 * Formata um globalScore para exibição na UI
 * 
 * @param globalScore - Global score a formatar
 * @returns String formatada para UI
 */
export function formatGlobalScoreDisplay(globalScore: number | undefined): string {
  if (globalScore === undefined) return "0";
  return String(globalScore);
}

/**
 * Retorna a cor para exibição de um score na UI
 * Scores positivos aparecem em verde, negativos em vermelho
 * 
 * @param score - Score a colorir
 * @param positiveColor - Cor para positivo (padrão: cyan)
 * @param negativeColor - Cor para negativo (padrão: danger/red)
 * @returns Cor hex
 */
export function getScoreColor(
  score: number | undefined,
  positiveColor: string = "#00F2FF",
  negativeColor: string = "#FF4444"
): string {
  if (!score || score === 0) return "#888888";
  return score > 0 ? positiveColor : negativeColor;
}
