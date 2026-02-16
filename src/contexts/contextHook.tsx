import { useContext } from 'react';
import { PlayersContext } from './playersContext';

export function usePlayers() {
  const context = useContext(PlayersContext);

  if (!context) {
    throw new Error('usePlayers deve ser usado dentro de um PlayersProvider');
  }

  return context;
}