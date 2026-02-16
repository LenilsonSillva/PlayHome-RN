import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlobalPlayer } from '@/games/common/types/player';

interface PlayersContextData {
  players: GlobalPlayer[];
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  clearPlayers: () => void;
  loading: boolean;
}

export const PlayersContext = createContext<PlayersContextData>({} as PlayersContextData);

export const PlayersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<GlobalPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar jogadores salvos ao abrir o app
  useEffect(() => {
    async function loadStorageData() {
      const storagePlayers = await AsyncStorage.getItem('@PlayHome:players');
      if (storagePlayers) {
        setPlayers(JSON.parse(storagePlayers));
      }
      setLoading(false);
    }
    loadStorageData();
  }, []);

  // Salvar no storage sempre que a lista mudar
  useEffect(() => {
    async function saveData() {
      await AsyncStorage.setItem('@PlayHome:players', JSON.stringify(players));
    }
    saveData();
  }, [players]);

  const addPlayer = useCallback((name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    // Evita nomes duplicados
    const alreadyExists = players.some(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (alreadyExists) {
      alert("Este tripulante já está na lista!");
      return;
    }

    const newPlayer: GlobalPlayer = {
      // Gerador de ID seguro para Mobile
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      name: trimmedName,
    };

    setPlayers((prev) => [...prev, newPlayer]);
  }, [players]);

  const removePlayer = useCallback((id: string) => {
    setPlayers((prev) => prev.filter((player) => player.id !== id));
  }, []);

  const clearPlayers = useCallback(() => {
    setPlayers([]);
  }, []);

  return (
    <PlayersContext.Provider value={{ players, addPlayer, removePlayer, clearPlayers, loading }}>
      {children}
    </PlayersContext.Provider>
  );
};