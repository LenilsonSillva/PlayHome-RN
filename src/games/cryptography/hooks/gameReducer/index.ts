import { GameAction } from "./types";
import { commonReducer } from "./commonReducer";
import { infiltrationReducer } from "./infiltrationReducer";
import { interceptionReducer } from "./interceptionReducer";
import { CryptoGameState } from "../../types/game";

export function gameReducer(state: CryptoGameState | null, action: GameAction): CryptoGameState | null {
  if (action.type === "QUIT_GAME") return null;

  // START_GAME pode rodar sem state
  if (action.type === "START_GAME") {
    return commonReducer(state, action);
  }

  // qualquer outra action precisa de state
  if (!state) return state;

  switch (action.type) {
    case "SET_OPERATOR":
    case "SET_STARTING_TEAM":
    case "SET_RANDOM_OPERATORS":
    case "BEGIN_ACTION_PHASE":
    case "START_TIMER":
    case "REROLL_WORD":
    case "NEXT_ROUND":
      return commonReducer(state, action);

    case "INFILTRATION_WORD":
    case "FINISH_INFILTRATION_TURN":
      return infiltrationReducer(state, action);

    case "INTERCEPTION_RESULT":
    case "PASS_INTERCEPTION_TURN":
      return interceptionReducer(state, action);

    default:
      return state;
  }
}
