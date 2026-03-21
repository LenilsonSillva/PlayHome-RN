import { WORDS } from "@/games/common/data/words";

export function getUniqueWord(selectedCategories: string[], usedWordsArray: string[]) {
  const usedSet = new Set(usedWordsArray);
  const filteredWords = WORDS.filter((w) => selectedCategories.includes(w.category));

  // A última palavra que foi usada (para evitar repetição imediata no reset)
  const lastWord = usedWordsArray.length > 0 ? usedWordsArray[usedWordsArray.length - 1] : null;

  let availableWords = filteredWords.filter((w) => !usedSet.has(w.word));
  let didReset = false;
  let pool = availableWords;

  if (availableWords.length === 0) {
    // Se resetar, pegamos todas as palavras da categoria,
    // MAS filtramos para não vir a mesma que acabou de sair
    pool = filteredWords.filter((w) => w.word !== lastWord);

    // Caso de segurança: se a categoria só tiver 1 palavra (raro), volta ela mesma
    if (pool.length === 0) pool = filteredWords;

    didReset = true;
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  const selectedWord = pool[randomIndex].word;

  return {
    word: selectedWord,
    didReset
  };
}
