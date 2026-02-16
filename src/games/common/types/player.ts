export type GlobalPlayer = {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  score?: number;
  globalScore?: number;
};

export type OnlinePlayer = GlobalPlayer & {
  ready: boolean;
  revealed?: boolean;
  voted?: boolean;
};
