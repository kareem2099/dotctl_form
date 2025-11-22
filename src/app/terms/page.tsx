'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import '../i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function TermsPage() {
  const { t } = useTranslation('terms');
  const router = useRouter();

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-500 via-purple-500 to-blue-600 py-12 px-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="max-w-4xl mx-auto">
        {/* Header with navigation */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">{t('header.title')}</h1>
            <p className="text-white/70">{t('header.lastUpdated')}</p>
          </div>

          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('introduction.title')}</h2>
            <p className="text-white/90 mb-4">{t('introduction.paragraph1')}</p>
            <p className="text-white/90">{t('introduction.paragraph2')}</p>
          </section>

          {/* Definitions */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('definitions.title')}</h2>
            <ul className="text-white/90 space-y-2 ml-4">
              <li><strong>{t('definitions.software')}:</strong> {t('definitions.software')}</li>
              <li><strong>{t('definitions.user')}:</strong> {t('definitions.user')}</li>
              <li><strong>{t('definitions.beta')}:</strong> {t('definitions.beta')}</li>
            </ul>
          </section>

          {/* License */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('license.title')}</h2>
            <p className="text-white/90 mb-4">{t('license.paragraph1')}</p>
            <p className="text-white/90">{t('license.paragraph2')}</p>
          </section>

          {/* Beta Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('betaTerms.title')}</h2>
            <p className="text-white/90 mb-4">{t('betaTerms.paragraph1')}</p>
            <p className="text-white/90 mb-4">{t('betaTerms.paragraph2')}</p>
            <p className="text-white/90">{t('betaTerms.paragraph3')}</p>
          </section>

          {/* User Obligations */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('userObligations.title')}</h2>
            <p className="text-white/90 mb-4">{t('userObligations.paragraph1')}</p>
            <p className="text-white/90 mb-4">{t('userObligations.paragraph2')}</p>
            <p className="text-white/90">{t('userObligations.paragraph3')}</p>
          </section>

          {/* Acceptable Use */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('acceptableUse.title')}</h2>
            <p className="text-white/90 mb-4">{t('acceptableUse.paragraph1')}</p>
            <ul className="text-white/90 space-y-2 ml-4">
              <li>• {t('acceptableUse.bullet1')}</li>
              <li>• {t('acceptableUse.bullet2')}</li>
              <li>• {t('acceptableUse.bullet3')}</li>
              <li>• {t('acceptableUse.bullet4')}</li>
              <li>• {t('acceptableUse.bullet5')}</li>
              <li>• {t('acceptableUse.bullet6')}</li>
            </ul>
          </section>

          {/* Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('privacy.title')}</h2>
            <p className="text-white/90 mb-4">{t('privacy.paragraph1')}</p>
            <p className="text-white/90">{t('privacy.paragraph2')}</p>
          </section>

          {/* Disclaimers */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('disclaimers.title')}</h2>
            <p className="text-white/90 mb-4">{t('disclaimers.paragraph1')}</p>
            <p className="text-white/90 mb-4">{t('disclaimers.paragraph2')}</p>
            <p className="text-white/90 mb-4">{t('disclaimers.paragraph3')}</p>
            <p className="text-white/90">{t('disclaimers.paragraph4')}</p>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('limitation.title')}</h2>
            <p className="text-white/90 mb-4">{t('limitation.paragraph1')}</p>
            <p className="text-white/90 mb-4">{t('limitation.paragraph2')}</p>
            <p className="text-white/90">{t('limitation.paragraph3')}</p>
          </section>

          {/* Termination */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('termination.title')}</h2>
            <p className="text-white/90 mb-4">{t('termination.paragraph1')}</p>
            <p className="text-white/90">{t('termination.paragraph2')}</p>
          </section>

          {/* Changes to Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('changes.title')}</h2>
            <p className="text-white/90 mb-4">{t('changes.paragraph1')}</p>
            <p className="text-white/90">{t('changes.paragraph2')}</p>
          </section>

          {/* Governing Law */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('governing.title')}</h2>
            <p className="text-white/90">{t('governing.paragraph1')}</p>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('contact.title')}</h2>
            <p className="text-white/90 mb-4">{t('contact.paragraph1')}</p>
            <p className="text-white/80">{t('contact.email')}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
