import { useState, useCallback, useRef, useEffect } from "react";
import type { ImpostorGame, ImpostorPlayer } from "../types/game";
import type { LobbyState, LobbyConfig } from "../types/lobbyOffline";
import { initializeGame } from "../logic/initializeGame";
import { saveGlobalUsedWords, loadGlobalUsedWords } from "@/games/common/utils/wordStorage";
import { getRoundPoints } from "../utils/scoringUtils";

export type UseOfflineImpostorReturn = {
  lobby: LobbyState;
  game: ImpostorGame | null;
  addPlayer: (player: ImpostorPlayer) => void;
  removePlayer: (playerId: string) => void;
  setLobbyConfig: (config: Partial<LobbyConfig>) => void;
  startGame: (initialPlayers?: any[], initialConfig?: LobbyConfig, globalUsedWords?: string[]) => void;
  nextPhase: (newPhase: ImpostorGame["phase"]) => void;
  handleReroll: () => void;
  eliminatePlayer: (playerId: string | null) => void;
  resolveElimination: () => void;
  votes: Record<string, string | null>;
  submitVote: (voterId: string, targetId: string | null) => void;
  processVotingResult: (finalVotes?: Record<string, string | null>) => string | null;
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
      impostorCat: false,
      impostorsUnited: false 
    }
  });

  const [game, setGame] = useState<ImpostorGame | null>(null);
  const [votes, setVotes] = useState<Record<string, string | null>>({});

  const impostorHistoryRef = useRef<string[][]>([]);

  useEffect(() => {
    if (game?.usedWords) {
      saveGlobalUsedWords(game.usedWords);
    }
  }, [game?.usedWords]);

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
    async (initialPlayers?: any[], initialConfig?: LobbyConfig, globalUsedWords?: string[]) => {
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
              impostorCat: game.impostorCat,
              impostorsUnited: game.impostorsUnited
            }
          : lobby.config);

      if (!playersToUse.length) return;

      // 🔥 MÁGICA AQUI: Se globalUsedWords não foi enviado (ex: botão de Nova Rodada),
      // ele puxa o histórico atual da partida. Se o jogo for novo, ele usa[]
      let wordsToUse = globalUsedWords;

      if (!wordsToUse) {
        wordsToUse = game?.usedWords;

        if (!wordsToUse) {
          wordsToUse = await loadGlobalUsedWords(); // fallback final
        }
      }

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
        wordsToUse || []
      );

      const currentImps = initialized.players.filter((p) => p.isImpostor).map((p) => p.id);
      impostorHistoryRef.current.push(currentImps);

      setGame({
        ...initialized,
        phase: "reveal",
        impostorHistory: impostorHistoryRef.current,
        impostorsUnited: configToUse.impostorsUnited || false,
        usedWords: initialized.didReset ? initialized.chosenWord : [...(wordsToUse || []), ...initialized.chosenWord]
      });
    },
    [lobby, game]
  );

  const handleReroll = useCallback(() => {
    if (!game) return;

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
      game.usedWords
    );

    setGame({
      ...newGame,
      phase: "reveal",
      impostorHistory: impostorHistoryRef.current,
      impostorsUnited: game.impostorsUnited, 
      usedWords: newGame.didReset ? newGame.chosenWord : [...game.usedWords, ...newGame.chosenWord]
    });
  }, [game]);

  const nextPhase = useCallback((newPhase: ImpostorGame["phase"]) => {
    setGame((prev) => (prev ? { ...prev, phase: newPhase } : null));
  }, []);

  const eliminatePlayer = useCallback((playerId: string | null) => {
    setGame((prev) => {
      if (!prev) return null;
      const updatedPlayers = prev.players.map((p) => (p.id === playerId ? { ...p, isAlive: false } : p));
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
