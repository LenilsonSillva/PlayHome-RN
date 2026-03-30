import type { GlobalPlayer } from "../../common/types/player";
import type { ImpostorGame, ImpostorPlayer } from "../types/game";
import { createImpostorPlayers } from "./createPlayers";
import { distributeWords } from "./distributeWords";
import { pickRandom } from "../../common/utils/array";
import { WordData } from "@/games/common/data/words/types";

export function getImpostorCount(playersCount: number): number {
  if (playersCount >= 7) return 3;
  if (playersCount >= 5) return 2;
  return 1;
}

export function selectWhoStart(
  playersData: ImpostorPlayer[],
  whoStartButton: boolean,
  impostorCanStart: boolean
): string | undefined {
  if (!whoStartButton) return undefined;
  const candidate = pickRandom(playersData);
  if ("isImpostor" in candidate && candidate.isImpostor && !impostorCanStart)
    return selectWhoStart(playersData, whoStartButton, impostorCanStart);
  return candidate.name;
}

export function initializeGame(
  allPlayers: GlobalPlayer[],
  impostorCount: number,
  twoWordsMode: boolean,
  impostorHasHint: boolean,
  selectedCategories: string[],
  whoStartButton: boolean,
  impostorCanStart: boolean,
  impostorTrap: boolean,
  impostorCat: boolean,
  impostorHistory: string[][] = [],
  usedWords: string[] = [],
   wordDatabase: WordData[],
   wordsLanguage: string,
): ImpostorGame {
  // 1. Cria os jogadores (define quem é impostor, emoji e cor)
  const impostorPlayers = createImpostorPlayers(allPlayers, impostorCount, impostorHistory);

  // 2. Distribui as palavras
  const { updatedPlayers, chosenWord, didReset } = distributeWords(
    impostorPlayers,
    twoWordsMode,
    selectedCategories,
    wordDatabase,
    impostorHasHint,
    impostorTrap,
    impostorCat,
    usedWords
  );

  // 3. Define quem começa (usando a lista atualizada de jogadores)
  const whoStart = selectWhoStart(updatedPlayers, whoStartButton, impostorCanStart);

  // O retorno deve bater exatamente com o seu Type 'ImpostorGame'
  return {
    players: updatedPlayers, // Nome da chave conforme seu type
    impostorCount,
    twoWordsMode,
    impostorHasHint,
    impostorTrap,
    impostorCat,
    impostorsUnited: false,
    impostorCanStart,
    selectedCategories,
    chosenWord,
    whoStart,
    phase: "reveal",
    impostorHistory,
    usedWords,
    didReset,
    activeWordList: wordDatabase,
    wordsLanguage,
  };
}
