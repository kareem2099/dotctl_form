'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function CheckPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [checkEmail, setCheckEmail] = useState('');
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [error, setError] = useState('');

  const checkUserRegistration = useCallback(async (email: string) => {
    setIsCheckingUser(true);
    try {
      const response = await fetch(`/api/check-user?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (data.registered) {
        localStorage.setItem('betaUserEmail', email);
        router.push('/dashboard');
      } else {
        localStorage.removeItem('betaUserEmail');
        router.push('/form');
      }
    } catch (err) {
      console.error('Error checking user:', err);
      setError(t('check.errorMessage'));
    } finally {
      setIsCheckingUser(false);
    }
  }, [router, t]);

  useEffect(() => {
    // Check if user is already registered on mount
    const savedEmail = localStorage.getItem('betaUserEmail');
    if (savedEmail) {
      checkUserRegistration(savedEmail);
    }
  }, [checkUserRegistration]);

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkEmail.trim()) {
      await checkUserRegistration(checkEmail.trim());
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-500 via-purple-500 to-blue-600 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      <div className="absolute top-4 left-4 z-10">
        <Link
          href="/home"
          className="inline-flex items-center px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('check.homeButton')}
        </Link>
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl max-w-md w-full animate-fadeInUp">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{t('check.welcomeBack')}</h1>
          <p className="text-white/90">{t('check.checkStatus')}</p>
        </div>

        {error && <p className="text-red-300 text-center mb-4">{error}</p>}

        <form onSubmit={handleEmailCheck} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
            <input
              type="email"
              value={checkEmail}
              onChange={(e) => setCheckEmail(e.target.value)}
              placeholder={t('check.emailPlaceholder')}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all duration-200 backdrop-blur-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isCheckingUser}
            className="w-full py-3 px-6 bg-linear-to-r from-white to-white/90 text-purple-700 font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-white/90 hover:to-white transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCheckingUser ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                {t('check.checkingButton')}
              </>
            ) : (
              t('check.continueButton')
            )}
          </button>
        </form>

        <div className="text-center mt-6 space-y-3">
          <p className="text-white/60 text-sm">{t('check.newUser')}</p>
          <Link
            href="/form"
            className="inline-block text-white/80 hover:text-white underline transition-colors duration-200"
          >
            {t('check.goToSignup')}
          </Link>
        </div>
      </div>
    </div>
  );
}
