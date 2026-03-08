/**
 * Jogador base com informações pessoais
 * Usado em lobby e dados iniciais
 */
export type GlobalPlayer = {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  score?: number;
  globalScore?: number;
};

/**
 * Jogador online com status de sessão
 * Estende GlobalPlayer com informações de conexão
 */
export type OnlinePlayer = GlobalPlayer & {
  socketId: string;
  ready?: boolean;
  revealed?: boolean;
  voted?: boolean;
};

