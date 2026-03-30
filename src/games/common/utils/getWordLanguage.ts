import i18n from "@/i18n";
import { WordsLanguage } from "../data/words/types";

export function getWordsLanguage(): WordsLanguage {
  const lang = i18n.language;

  if (!lang) return "en-US"; // 🔥 ESSENCIAL

  if (lang.startsWith("pt-PT")) return "pt-PT";
  if (lang.startsWith("pt")) return "pt-BR";

  if (lang.startsWith("en-GB")) return "en-GB";
  if (lang.startsWith("en")) return "en-US";

  if (lang.startsWith("es")) return "es-ES";

  return "en-US";
}