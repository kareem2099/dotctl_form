'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import i18n from '../i18n';

const LanguageSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'EN' },
    { code: 'ar', name: 'العربية' },
    { code: 'fr', name: 'FR' },
    { code: 'de', name: 'DE' },
    { code: 'ru', name: 'RU' },
    { code: 'es', name: 'ES' },
  ];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode).then(() => {
      document.documentElement.lang = languageCode;
    });
    setIsOpen(false);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200 text-white"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{currentLanguage.name}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl overflow-hidden w-48 z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`w-full text-left px-4 py-3 hover:bg-white/20 transition-colors duration-200 ${
                i18n.language === language.code
                  ? 'bg-white/30 text-white font-semibold'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {language.name}
            </button>
          ))}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSwitcher;
