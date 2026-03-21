import { WORDS } from "@/games/common/data/words";

export function getUniqueWord(selectedCategories: string[], usedWordsArray: string[]) {
  const usedSet = new Set(usedWordsArray); 
  const filteredWords = WORDS.filter((w) => selectedCategories.includes(w.category));
  const availableWords = filteredWords.filter((w) => !usedSet.has(w.word));

  let pool = availableWords;
  let didReset = false;

  // 🔥 Se acabaram as palavras inéditas, reinicia o pool e avisa o sistema!
  if (availableWords.length === 0) {
    pool = filteredWords.length > 0 ? filteredWords : WORDS;
    didReset = true; 
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  
  // Agora retornamos a palavra E o aviso se o banco resetou
  return { 
    word: pool[randomIndex].word, 
    didReset 
  };
}