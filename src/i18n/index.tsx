// ./src/i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import { I18nManager } from "react-native";

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

// Importação das variações regionais (Overrides)
import ptPT from "./pt-PT.json";
import enGB from "./en-GB.json";
import es419 from "./es-419.json";

// 1. Detectar o idioma completo do dispositivo (ex: 'pt-PT' em vez de apenas 'pt')
const locales = Localization.getLocales();
const deviceLanguage = locales[0].languageTag ?? "en";

// 2. Verificar se o idioma é RTL (Árabe)
const isRTL = deviceLanguage.startsWith("ar");
I18nManager.allowRTL(isRTL);
I18nManager.forceRTL(isRTL);

i18n.use(initReactI18next).init({
  resources: {
    // Bases
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

    // Variações regionais
    "pt-PT": { translation: ptPT },
    "en-GB": { translation: enGB },
    "es-419": { translation: es419 }
  },

  lng: deviceLanguage,

  // 3. Configuração de Fallback Inteligente
  fallbackLng: {
    "pt-PT": ["pt"], // Se faltar em PT Portugal, usa PT Brasil
    "en-GB": ["en"], // Se faltar em EN Britânico, usa EN Americano
    "es-419": ["es"], // Se faltar em ES Latam, usa ES Espanha
    default: ["en"] // Se nada funcionar, usa Inglês
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
