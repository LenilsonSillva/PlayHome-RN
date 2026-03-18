import { WORDS } from "@/games/common/data/words";

export function getUniqueWord(selectedCategories: string[], usedWordsArray: string[]): string {
  const usedSet = new Set(usedWordsArray); // 🔥 Conversão rápida e segura!

  const filteredWords = WORDS.filter((w) => selectedCategories.includes(w.category));
  
  // Agora a busca é instantânea, mesmo com 1000+ palavras
  const availableWords = filteredWords.filter((w) => !usedSet.has(w.word));

  const pool = availableWords.length > 0 ? availableWords : filteredWords.length > 0 ? filteredWords : WORDS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  
  return pool[randomIndex].word;
}