// ./src/i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import { I18nManager } from "react-native";

// Importação de todos os arquivos de tradução
import pt from "./pt.json";
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
import de from "./de.json";
import it from "./it.json";
import ja from "./ja.json";
import ko from "./ko.json";
import ru from "./ru.json";
import zh from "./zh.json"; // Chinês Simplificado
import hi from "./hi.json"; // Hindi
import ar from "./ar.json"; // Árabe

// 1. Detectar o idioma do dispositivo
// Localization.getLocales() retorna uma lista, pegamos a primeira posição (preferencial)
const deviceLanguage = Localization.getLocales()[0].languageCode ?? "en";

// 2. Verificar se o idioma é RTL (Árabe) para preparar o espelhamento futuro
const isRTL = deviceLanguage === "ar";
I18nManager.allowRTL(isRTL);
I18nManager.forceRTL(isRTL);

i18n.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
    it: { translation: it },
    ja: { translation: ja },
    ko: { translation: ko },
    ru: { translation: ru },
    zh: { translation: zh },
    hi: { translation: hi },
    ar: { translation: ar }
  },
  // Define o idioma detectado ou usa o fallback
  lng: deviceLanguage,
  fallbackLng: "en",
  compatibilityJSON: "v4",
  defaultNS: "translation",
  interpolation: {
    escapeValue: false // React já protege contra XSS
  },
  react: {
    useSuspense: false // Evita problemas de renderização no React Native
  }
});

export default i18n;
