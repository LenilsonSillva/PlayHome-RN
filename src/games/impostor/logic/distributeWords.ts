import type { ImpostorPlayer } from "../types/game";
import type { WordData } from "../../common/data/words";
import { shuffleArray, pickRandom } from "../../common/utils/array";

export function distributeWords(
  players: ImpostorPlayer[],
  twoWordsMode: boolean,
  selectedCategories: string[],
  wordBank: WordData[],
  impostorHasHint: boolean,
  usedWords: string[] = []
): { updatedPlayers: ImpostorPlayer[]; chosenWord: string[] } {
  let filteredWords = wordBank.filter(w => selectedCategories.includes(w.category));
  let availableWords = filteredWords.filter(w => {
    const used = usedWords.includes(w.word);
    const relatedUsed = w.related?.some(r => usedWords.includes(r));
    return !used && !relatedUsed;
  });
  if (!availableWords.length) availableWords = filteredWords.length ? filteredWords : wordBank;

  const word = pickRandom(availableWords);
  const wordA = word.word;
  const wordB = twoWordsMode && word.related?.length ? word.related[0] : wordA;

  const nonImpostors = players.filter(p => !p.isImpostor);
  const groupAIds = shuffleArray(nonImpostors.map(p => p.id)).slice(0, Math.floor(nonImpostors.length / 2));

  const updatedPlayers = players.map(p => {
    if (p.isImpostor) return { ...p, word: null, hint: impostorHasHint ? word.hint : undefined };
    const finalWord = twoWordsMode && groupAIds.includes(p.id) ? wordB : wordA;
    return { ...p, word: finalWord };
  });

  return { updatedPlayers, chosenWord: [wordA, wordB] };
}
