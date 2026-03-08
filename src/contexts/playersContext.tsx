import React, { createContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GlobalPlayer } from "@/games/common/types/player";
import { useAlert } from "./alertContext";
import { useTranslation } from "react-i18next";

interface PlayersContextData {
  players: GlobalPlayer[];
  addPlayer: (name: string, emoji: string) => void;
  removePlayer: (id: string) => void;
  clearPlayers: () => void;
  updatePlayer: (id: string, data: Partial<GlobalPlayer>) => void;
  loading: boolean;
}

export const PlayersContext = createContext<PlayersContextData>({} as PlayersContextData);

export const PlayersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<GlobalPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();
  const {t} = useTranslation();

  // Carregar jogadores salvos ao abrir o app
  useEffect(() => {
    async function loadStorageData() {
      const storagePlayers = await AsyncStorage.getItem("@PlayHome:players");
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
      await AsyncStorage.setItem("@PlayHome:players", JSON.stringify(players));
    }
    saveData();
  }, [players]);

  const addPlayer = useCallback(
    (name: string, emoji: string) => {
      const trimmedName = name.trim();
      if (!trimmedName) return;

      // Evita nomes duplicados
      const alreadyExists = players.some((p) => p.name.toLowerCase() === trimmedName.toLowerCase());

      if (alreadyExists) {
        showAlert(t("alerts.alert"), t("alerts.alreadyExist"));
        return;
      }

      const newPlayer: GlobalPlayer = {
        // Gerador de ID seguro para Mobile
        id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        name: trimmedName,
        emoji: emoji
      };

      setPlayers((prev) => [...prev, newPlayer]);
    },
    [players]
  );

  const updatePlayer = useCallback((id: string, data: Partial<GlobalPlayer>) => {
    setPlayers((prev) => prev.map((player) => (player.id === id ? { ...player, ...data } : player)));
  }, []);

  const removePlayer = useCallback((id: string) => {
    setPlayers((prev) => prev.filter((player) => player.id !== id));
  }, []);

  const clearPlayers = useCallback(() => {
    setPlayers([]);
  }, []);

  return (
    <PlayersContext.Provider value={{ players, addPlayer, removePlayer, clearPlayers, loading, updatePlayer }}>
      {children}
    </PlayersContext.Provider>
  );
};
