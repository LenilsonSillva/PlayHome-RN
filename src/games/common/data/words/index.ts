// src/games/common/data/words/index.ts
import { WORDS_BR, WORDS_PT } from "./portuguese";
import { WORDS_US, WORDS_GB } from "./english";
import { WORDS_ES, WORDS_LATAM } from "./spanish";
import { WORDS_FR } from "./french";
import { WORDS_DE } from "./german";
import { WORDS_IT } from "./italian";
import { WORDS_RU } from "./russian";
import { WORDS_KO } from "./korean";
import { WORDS_JA } from "./japanese";
import { WORDS_ZH } from "./chinese";
import { WORDS_HI } from "./hindi";
import { WORDS_AR } from "./arabic";
import { WordData } from "./types";

// Re-export para compatibilidade
export type { WordData } from "./types";

// Função Pura: Ela apenas recebe uma string e retorna o banco.
// Não depende de nenhum outro arquivo do sistema.
export const getWordDatabase = (lang: string): WordData[] => {
  if (!lang) return WORDS_US;

  const base = lang.split("-")[0];

  switch (lang) {
    case "pt-PT":
      return WORDS_PT;
    case "en-GB":
      return WORDS_GB;
    case "es-419":
      return WORDS_LATAM;
    default:
      switch (base) {
        case "pt":
          return WORDS_BR;
        case "en":
          return WORDS_US;
        case "es":
          return WORDS_ES;
        case "fr":
          return WORDS_FR;
        case "de":
          return WORDS_DE;
        case "it":
          return WORDS_IT;
        case "ru":
          return WORDS_RU;
        case "ko":
          return WORDS_KO;
        case "ja":
          return WORDS_JA;
        case "zh":
          return WORDS_ZH;
        case "hi":
          return WORDS_HI;
        case "ar":
          return WORDS_AR;
        default:
          return WORDS_US;
      }
  }
};

// Função para extrair categorias de um banco de palavras
export const getCategories = (wordDatabase: WordData[]): string[] => {
  return Array.from(new Set(wordDatabase.map((w) => w.category))).sort();
};

// Para compatibilidade com código antigo que importa WORDS do index
// Usamos o banco padrão em inglês
export const WORDS = WORDS_US;

// Para compatibilidade, exportar as categorias do banco padrão
export const categories = getCategories(WORDS_US);
