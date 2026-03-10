import { createContext, useContext, useState, useEffect } from 'react';

const LANG_STORAGE_KEY = 'etqan-admin-lang';

function getStored() {
  if (typeof window === 'undefined') return 'ar';
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    return stored === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(getStored);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', lang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (_) {}
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
