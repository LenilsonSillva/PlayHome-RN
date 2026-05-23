// ./src/i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Importação das bases principais
import pt from "./pt.json";
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
import de from "./de.json";
import it from "./it.json";
import ja from "./ja.json";
import ko from "./ko.json";
import ru from "./ru.json";
import zh from "./zh.json";
import hi from "./hi.json";
import ar from "./ar.json";

// Importação das variações regionais
import ptPT from "./pt-PT.json";
import enGB from "./en-GB.json";
import es419 from "./es-419.json";

const STORED_LANG_KEY = "@playhome_user_language";

// 1. Criar o Detector de Idioma para AsyncStorage
const languageDetector: any = {
  type: "languageDetector",
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      // Tenta recuperar o idioma que o usuário salvou anteriormente
      const savedLanguage = await AsyncStorage.getItem(STORED_LANG_KEY);

      if (savedLanguage) {
        return callback(savedLanguage);
      }

      // Se não houver idioma salvo (primeira vez), detecta o do dispositivo
      const deviceLanguage = Localization.getLocales()[0].languageTag ?? "en";
      callback(deviceLanguage);
    } catch (error) {
      console.log("Erro ao detectar idioma:", error);
      callback("en"); // Fallback final caso o storage falhe
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      // Sempre que o idioma mudar, salva no AsyncStorage
      await AsyncStorage.setItem(STORED_LANG_KEY, lng);

      // Lógica de espelhamento (RTL) para Árabe
      const isRTL = lng.startsWith("ar");
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
        // Nota: O reinício do App deve ser tratado na função de troca de idioma (changeLanguage)
      }
    } catch (error) {}
  }
};

i18n
  .use(languageDetector) // ✅ Adiciona o detector customizado
  .use(initReactI18next)
  .init({
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
      ar: { translation: ar },
      "pt-PT": { translation: ptPT },
      "en-GB": { translation: enGB },
      "es-419": { translation: es419 }
    },

    fallbackLng: {
      "pt-PT": ["pt"],
      "en-GB": ["en"],
      "es-419": ["es"],
      default: ["en"]
    },

    compatibilityJSON: "v4",
    defaultNS: "translation",
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
