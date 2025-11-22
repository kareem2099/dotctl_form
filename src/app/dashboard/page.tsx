'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReferralDashboard from '../components/ReferralDashboard';
import LanguageSwitcher from '../components/LanguageSwitcher';

type UserData = {
  referralCode: string;
  referralCount: number;
  rewardMonths: number;
  shareLink: string;
  milestonesReached: Array<{
    milestone: string;
    achievedAt: Date;
    bonusMonthsGranted: number;
  }>;
  effectiveSubscription: {
    yearsFromReferrals: number;
    remainingMonths: number;
    display: string;
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const checkUserStatus = useCallback(async () => {
    const savedEmail = localStorage.getItem('betaUserEmail');

    if (!savedEmail) {
      // No email, redirect to check page
      router.push('/check');
      return;
    }

    try {
      const response = await fetch(`/api/check-user?email=${encodeURIComponent(savedEmail)}`);

      if (response.ok) {
        const data = await response.json();

        if (data.registered) {
          setUserData(data);
        } else {
          // Email not registered anymore? Redirect to form
          router.push('/form');
        }
      } else {
        setError(t('dashboard.error.unknownError'));
      }
    } catch (err) {
      console.error('Error checking user:', err);
      setError(t('dashboard.error.connectionError'));
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    checkUserStatus();
  }, [checkUserStatus]);

  const resetToCheck = () => {
    setUserData(null);
    setLoading(false);
    setError('');
    localStorage.removeItem('betaUserEmail');
    router.push('/check');
  };

  if (loading) {
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

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl max-w-md w-full animate-fadeInUp text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('dashboard.loading.title')}</h2>
          <p className="text-white/70">{t('dashboard.loading.subtitle')}</p>
        </div>
      </div>
    );
  }

  if (error) {
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

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl max-w-md w-full animate-fadeInUp text-center">
          <div className="text-red-400 mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">{t('dashboard.error.title')}</h2>
          <p className="text-white/90 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => checkUserStatus()}
              className="w-full py-3 px-6 bg-linear-to-r from-white to-white/90 text-purple-700 font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-white/90 hover:to-white transform transition-all duration-200"
            >
              {t('dashboard.Actions.tryAgain')}
            </button>
            <button
              onClick={resetToCheck}
              className="w-full py-2 px-4 text-white/70 hover:text-white underline transition-colors duration-200"
            >
              {t('dashboard.Actions.checkAnotherEmail')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
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

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl max-w-md w-full animate-fadeInUp text-center">
          <div className="text-yellow-400 mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-4">{t('dashboard.access.restricted.title')}</h2>
          <p className="text-white/90 mb-6">{t('dashboard.access.restricted.message')}</p>
          <div className="space-y-3">
            <Link
              href="/check"
              className="inline-block w-full py-3 px-6 bg-linear-to-r from-white to-white/90 text-purple-700 font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-white/90 hover:to-white transform transition-all duration-200 text-center"
            >
              {t('dashboard.access.restricted.checkStatus')}
            </Link>
            <Link
              href="/form"
              className="inline-block w-full py-2 px-4 text-white/70 hover:text-white underline transition-colors duration-200"
            >
              {t('dashboard.access.restricted.joinBeta')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show referral dashboard for registered users
  return <ReferralDashboard userData={userData} resetToDashboard={resetToCheck} />;
}
