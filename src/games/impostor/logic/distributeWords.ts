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
): { updatedPlayers: ImpostorPlayer[]; chosenWord: string[]; didReset: boolean } {
  
  // 1. Filtra as palavras das categorias escolhidas
  const filteredWords = wordBank.filter((w) => selectedCategories.includes(w.category));
  
  // 2. Lógica de Disponibilidade Estrita
  let availableWords = filteredWords.filter((w) => {
    const isWordUsed = usedWords.includes(w.word);
    
    // Se NÃO for modo 2 palavras, apenas a palavra exata conta
    if (!twoWordsMode) return !isWordUsed;

    // Se FOR modo 2 palavras, a palavra OU qualquer relacionada usada bloqueia o sorteio
    const isRelatedUsed = w.related?.some((r) => usedWords.includes(r));
    return !isWordUsed && !isRelatedUsed;
  });

  let didReset = false;
  const lastWord = usedWords.length > 0 ? usedWords[usedWords.length - 1] : null;

  // 3. Gatilho de Reset (Quando o "baralho" acaba)
  if (availableWords.length === 0) {
    didReset = true;
    // No reset, pegamos todas as palavras da categoria, EXCETO a que acabou de sair
    availableWords = filteredWords.filter(w => w.word !== lastWord);
    
    // Fallback de segurança
    if (availableWords.length === 0) availableWords = filteredWords;
  }

  const word = pickRandom(availableWords);
  const wordA = word.word;
  const hasRelated = word.related && word.related.length > 0;
  
  // No modo 2 palavras, pega a relacionada. No modo normal, repete a WordA
  const wordB = (twoWordsMode && hasRelated) ? word.related![0] : wordA;

  // Array de retorno para o usedWords
  const wordsThisRound = (twoWordsMode && hasRelated && wordA !== wordB) 
    ? [wordA, wordB] 
    : [wordA];

  const nonImpostors = players.filter((p) => !p.isImpostor);
  const groupAIds = shuffleArray(nonImpostors.map((p) => p.id)).slice(0, Math.floor(nonImpostors.length / 2));

  const updatedPlayers = players.map((p) => {
    if (p.isImpostor) {
      let hint = undefined;
      if (impostorHasHint) {
        hint = impostorCat ? word.category : word.hint;
        if (impostorTrap && Math.random() < 0.5) {
          const fake = pickRandom(wordBank.filter((w) => w.word !== word.word));
          hint = impostorCat ? fake.category : fake.hint;
        }
      }
      return { ...p, word: null, hint };
    }
    const finalWord = (twoWordsMode && groupAIds.includes(p.id)) ? wordB : wordA;
    return { ...p, word: finalWord };
  });

  return { updatedPlayers, chosenWord: wordsThisRound, didReset };
}