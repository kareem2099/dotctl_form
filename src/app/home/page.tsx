'use client';

import Link from 'next/link';
import { Target, Mail, CheckCircle, ArrowRight } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-500 via-purple-500 to-blue-600 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl max-w-4xl w-full animate-fadeInUp">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-6">{t('home.title')}</h1>
          <p className="text-xl text-white/90 mb-2">
            {t('home.subtitle')}
          </p>
          <p className="text-white/70 mb-12">
            {t('home.description')}
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <Target className="w-12 h-12 text-blue-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{t('home.trafficControl')}</h3>
              <p className="text-white/70">{t('home.trafficControlDesc')}</p>
            </div>

            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{t('home.deepInspection')}</h3>
              <p className="text-white/70">{t('home.deepInspectionDesc')}</p>
            </div>

            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <Mail className="w-12 h-12 text-purple-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{t('home.betaProgram')}</h3>
              <p className="text-white/70">{t('home.betaProgramDesc')}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/check"
                className="inline-flex items-center px-8 py-3 bg-linear-to-r from-white to-white/90 text-purple-700 font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-white/90 hover:to-white transform transition-all duration-200"
              >
                {t('home.checkStatusButton')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>

              <Link
                href="/form"
                className="inline-flex items-center px-8 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors duration-200"
              >
                {t('home.joinBetaButton')}
              </Link>
            </div>

            <p className="text-white/60 text-sm">
              {t('home.accessNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
