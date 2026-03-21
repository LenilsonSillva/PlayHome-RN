import AsyncStorage from "@react-native-async-storage/async-storage";

const GLOBAL_WORDS_KEY = "@playhome_used_words_history";

// Lê o histórico do celular
export const loadGlobalUsedWords = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(GLOBAL_WORDS_KEY);
    return data ? JSON.parse(data) :[];
  } catch (error) {
    console.error("Erro ao carregar palavras:", error);
    return [];
  }
};

// Salva o histórico atualizado
export const saveGlobalUsedWords = async (words: string[]) => {
  try {
    await AsyncStorage.setItem(GLOBAL_WORDS_KEY, JSON.stringify(words));
  } catch (error) {
    console.error("Erro ao salvar palavras:", error);
  }
};

// Zera o histórico (Usado quando as palavras acabam)
export const clearGlobalUsedWords = async () => {
  try {
    await AsyncStorage.removeItem(GLOBAL_WORDS_KEY);
  } catch (error) {
    console.error("Erro ao limpar histórico:", error);
  }
};