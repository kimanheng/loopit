import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations } from '../constants/Translations';

type Language = 'en' | 'km' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
  fonts: {
    heading: string;
    body: string;
  };
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: keyof typeof translations['en']) => {
    // Fallback to English if translation missing
    const dict = translations[language] as any;
    return dict[key] || translations['en'][key] || key;
  };

          const fonts = {
            heading: language === 'km' ? 'NotoSerifKhmer' : (language === 'zh' ? 'NotoSansSCBold' : 'RecoletaBold'),
            body: language === 'km' ? 'NotoSansKhmer' : (language === 'zh' ? 'NotoSansSCRegular' : 'GoogleSans'),
          };  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, fonts }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
