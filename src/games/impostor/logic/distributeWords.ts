import type { ImpostorPlayer } from "../types/game";
import type { WordData } from "../../common/data/words";
import { shuffleArray, pickRandom } from "../../common/utils/array";

export function distributeWords(
  players: ImpostorPlayer[],
  twoWordsMode: boolean,
  selectedCategories: string[],
  wordBank: WordData[],
  impostorHasHint: boolean,
  impostorTrap: boolean,
  impostorCat: boolean,
  usedWords: string[] = []
): { updatedPlayers: ImpostorPlayer[]; chosenWord: string[] } {
  let filteredWords = wordBank.filter((w) => selectedCategories.includes(w.category));
  let availableWords = filteredWords.filter((w) => {
    const used = usedWords.includes(w.word);
    const relatedUsed = w.related?.some((r) => usedWords.includes(r));
    return !used && !relatedUsed;
  });
  if (!availableWords.length) availableWords = filteredWords.length ? filteredWords : wordBank;

  const word = pickRandom(availableWords);
  const wordA = word.word;
  const wordB = twoWordsMode && word.related?.length ? word.related[0] : wordA;

  const nonImpostors = players.filter((p) => !p.isImpostor);
  const groupAIds = shuffleArray(nonImpostors.map((p) => p.id)).slice(0, Math.floor(nonImpostors.length / 2));

  const updatedPlayers = players.map((p) => {
    if (p.isImpostor) {
      let hint = undefined;

      if (impostorHasHint) {
        if (impostorCat) {
          // Só vê a categoria
          hint = word.category;
        } else {
          // Vê a dica da palavra
          hint = word.hint;
        }

        // Se a armadilha está ativa, 50% de chance de embaralhar a dica/categoria
        if (impostorTrap && Math.random() < 0.5) {
          const randomFakeWord = pickRandom(wordBank.filter((w) => w.word !== word.word));
          if (impostorCat) {
            hint = randomFakeWord.category;
          } else {
            hint = randomFakeWord.hint;
          }
        }
      }

      return { ...p, word: null, hint };
    }

    const finalWord = twoWordsMode && groupAIds.includes(p.id) ? wordB : wordA;
    return { ...p, word: finalWord };
  });

  return { updatedPlayers, chosenWord: [wordA, wordB] };
}
