// ./src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import pt from './pt.json';
import en from './en.json';
import es from './es.json';

i18n
  .use(initReactI18next)
  .init({
    // A estrutura precisa ser: [idioma] -> [namespace] -> [conteúdo]
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      es: { translation: es },
    },
    lng: 'pt',
    fallbackLng: 'en',
    compatibilityJSON: 'v4', // Crucial para React Native
    interpolation: {
      escapeValue: false,
    },
    // Adicione esta linha para garantir que ele carregue o namespace padrão
    defaultNS: 'translation', 
  });

export default i18n;