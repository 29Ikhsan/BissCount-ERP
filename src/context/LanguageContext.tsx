'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { translations } from '@/lib/i18n';

type LanguageContextType = {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
  formatCurrency: (val: number) => string;
  currency: string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default to ID (Indonesian) as requested by user
  const [locale, setLocale] = useState('id');
  const [currency, setCurrency] = useState('IDR');

  // Load from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem('aksia_locale');
    if (saved) setLocale(saved);
  }, []);

  const t = (key: string) => {
    return translations[locale]?.[key] || key;
  };

  const formatCurrency = (val: number) => {
    const formatter = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return formatter.format(val);
  };

  const updateLocale = (newLocale: string) => {
    setLocale(newLocale);
    localStorage.setItem('aksia_locale', newLocale);
  };

  return (
    <LanguageContext.Provider value={{ 
      locale, 
      setLocale: updateLocale, 
      t, 
      formatCurrency,
      currency 
    }}>
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
