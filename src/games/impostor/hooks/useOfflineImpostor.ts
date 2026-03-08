import { useState, useCallback, useRef, useEffect } from "react";
import type { ImpostorGame, ImpostorPlayer } from "../types/game";
import type { LobbyState, LobbyConfig } from "../types/lobbyOffline";
import { initializeGame } from "../logic/initializeGame";
import { getRoundPoints } from "../utils/scoringUtils";

export type UseOfflineImpostorReturn = {
  lobby: LobbyState;
  game: ImpostorGame | null;
  addPlayer: (player: ImpostorPlayer) => void;
  removePlayer: (playerId: string) => void;
  setLobbyConfig: (config: Partial<LobbyConfig>) => void;
  startGame: (initialPlayers?: any[], initialConfig?: LobbyConfig) => void;
  nextPhase: (newPhase: ImpostorGame["phase"]) => void;
  handleReroll: () => void;
  eliminatePlayer: (playerId: string | null) => void;
  resolveElimination: () => void;
  votes: Record<string, string | null>;
  submitVote: (voterId: string, targetId: string | null) => void;
  processVotingResult: (
    finalVotes?: Record<string, string | null>
  ) => string | null;
};

export function useOfflineImpostor(): UseOfflineImpostorReturn {
  const [lobby, setLobby] = useState<LobbyState>({
    players: [],
    config: {
      impostorCount: 1,
      twoWordsMode: false,
      impostorHasHint: false,
      impostorCanStart: false,
      selectedCategories: [],
      whoStartButton: false,
      impostorTrap: false,
      impostorCat: false 
    }
  });

  const [game, setGame] = useState<ImpostorGame | null>(null);
  const [votes, setVotes] = useState<Record<string, string | null>>({});

  const impostorHistoryRef = useRef<string[][]>([]);
  const wordHistoryRef = useRef<string[]>([]);

  const addPlayer = useCallback((player: ImpostorPlayer) => {
    setLobby((prev) => ({ ...prev, players: [...prev.players, player] }));
  }, []);

  const removePlayer = useCallback((playerId: string) => {
    setLobby((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== playerId)
    }));
  }, []);

  const setLobbyConfig = useCallback((config: Partial<LobbyConfig>) => {
    setLobby((prev) => ({ ...prev, config: { ...prev.config, ...config } }));
  }, []);

  const startGame = useCallback(
    (initialPlayers?: any[], initialConfig?: LobbyConfig) => {
      // 1. PRIORIDADE: Se já existe um jogo, usamos as configurações DELE para manter a consistência
      // Se não houver (primeira vez), usamos o que veio do parâmetro ou do lobby.
      const playersToUse = initialPlayers || game?.players || lobby.players;

      const configToUse =
        initialConfig ||
        (game
          ? {
              impostorCount: game.impostorCount,
              twoWordsMode: game.twoWordsMode,
              impostorHasHint: game.impostorHasHint,
              impostorCanStart: game.impostorCanStart,
              selectedCategories: game.selectedCategories,
              whoStartButton: !!game.whoStart,
              impostorTrap: game.impostorTrap,
              impostorCat: game.impostorCat
            }
          : lobby.config);

      if (!playersToUse.length) return;

      const initialized = initializeGame(
        playersToUse,
        configToUse.impostorCount,
        configToUse.twoWordsMode,
        configToUse.impostorHasHint,
        configToUse.selectedCategories,
        configToUse.whoStartButton,
        configToUse.impostorCanStart,
        configToUse.impostorTrap,
        configToUse.impostorCat,
        impostorHistoryRef.current,
        wordHistoryRef.current
      );

      const currentImps = initialized.players
        .filter((p) => p.isImpostor)
        .map((p) => p.id);
      impostorHistoryRef.current.push(currentImps);
      wordHistoryRef.current.push(...initialized.chosenWord);

      setGame({
        ...initialized,
        phase: "reveal",
        impostorHistory: impostorHistoryRef.current,
        usedWords: wordHistoryRef.current
      });
    },
    [lobby, game]
  );

  const handleReroll = useCallback(() => {
    if (!game) return;
    // O Reroll já usa as propriedades de 'game', então ele já se mantinha.
    const newGame = initializeGame(
      game.players,
      game.impostorCount,
      game.twoWordsMode,
      game.impostorHasHint,
      game.selectedCategories,
      !!game.whoStart,
      game.impostorCanStart,
      game.impostorTrap,
      game.impostorCat,
      impostorHistoryRef.current,
      wordHistoryRef.current
    );

    wordHistoryRef.current.push(...newGame.chosenWord);

    setGame({
      ...newGame,
      phase: "reveal",
      impostorHistory: impostorHistoryRef.current,
      usedWords: wordHistoryRef.current
    });
  }, [game]);

  const nextPhase = useCallback((newPhase: ImpostorGame["phase"]) => {
    setGame((prev) => (prev ? { ...prev, phase: newPhase } : null));
  }, []);

  const eliminatePlayer = useCallback((playerId: string | null) => {
    setGame((prev) => {
      if (!prev) return null;
      const updatedPlayers = prev.players.map((p) =>
        p.id === playerId ? { ...p, isAlive: false } : p
      );
      return { ...prev, players: updatedPlayers };
    });
  }, []);

  const resolveElimination = useCallback(() => {
    setGame((prev) => {
      if (!prev) return null;
      const survivors = prev.players.filter((p) => p.isAlive);
      const impostorsAlive = survivors.filter((p) => p.isImpostor).length;
      const crewAlive = survivors.length - impostorsAlive;

      const isGameOver = impostorsAlive === 0 || impostorsAlive >= crewAlive;

      if (isGameOver) {
        const updatedWithScores = prev.players.map((p) => {
          const roundPoints = getRoundPoints(p);
          return {
            ...p,
            score: roundPoints,
            globalScore: (p.globalScore || 0) + roundPoints
          };
        });
        return { ...prev, players: updatedWithScores, phase: "result" };
      }
      return { ...prev, phase: "discussion" };
    });
    setVotes({}); // Limpa os votos para a próxima rodada
  }, []);

  const submitVote = useCallback((voterId: string, targetId: string | null) => {
    setVotes((prev) => ({ ...prev, [voterId]: targetId }));
  }, []);

  const processVotingResult = useCallback(
    (finalVotes?: Record<string, string | null>) => {
      const votesToProcess = finalVotes || votes;
      const voteCounts: Record<string, number> = {};
      Object.values(votesToProcess).forEach((id) => {
        if (id) voteCounts[id] = (voteCounts[id] || 0) + 1;
      });

      let maxVotes = 0;
      let candidates: string[] = [];
      Object.entries(voteCounts).forEach(([id, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          candidates = [id];
        } else if (count === maxVotes) candidates.push(id);
      });
      return candidates.length !== 1 || maxVotes === 0 ? null : candidates[0];
    },
    [votes]
  );

  return {
    lobby,
    game,
    addPlayer,
    removePlayer,
    setLobbyConfig,
    startGame,
    nextPhase,
    handleReroll,
    eliminatePlayer,
    resolveElimination,
    votes,
    submitVote,
    processVotingResult
  };
}
