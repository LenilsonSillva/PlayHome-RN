// ./src/types/game.ts
export interface GameItem {
  id: string;
  title: string;
  description: string;
  route: 'Impostor' | 'Criptografia'; // Exemplo de rotas
  icon: string;
  accentColor: string;
}