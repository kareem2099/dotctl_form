'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import '../i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function PrivacyPage() {
  const { t } = useTranslation('privacy');
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

          {/* Information We Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('information.title')}</h2>

            <h3 className="text-xl font-medium text-white mb-3">{t('information.automatic.title')}</h3>
            <ul className="text-white/90 space-y-2 ml-4 mb-6">
              <li>• {t('information.automatic.point1')}</li>
              <li>• {t('information.automatic.point2')}</li>
              <li>• {t('information.automatic.point3')}</li>
              <li>• {t('information.automatic.point4')}</li>
            </ul>

            <h3 className="text-xl font-medium text-white mb-3">{t('information.provided.title')}</h3>
            <ul className="text-white/90 space-y-2 ml-4">
              <li>• {t('information.provided.point1')}</li>
              <li>• {t('information.provided.point2')}</li>
              <li>• {t('information.provided.point3')}</li>
              <li>• {t('information.provided.point4')}</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('use.title')}</h2>
            <ul className="text-white/90 space-y-2 ml-4">
              <li>• {t('use.purpose1')}</li>
              <li>• {t('use.purpose2')}</li>
              <li>• {t('use.purpose3')}</li>
              <li>• {t('use.purpose4')}</li>
              <li>• {t('use.purpose5')}</li>
              <li>• {t('use.purpose6')}</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('sharing.title')}</h2>
            <p className="text-white/90 mb-4">{t('sharing.paragraph1')}</p>
            <p className="text-white/90 mb-4">{t('sharing.serviceProviders')}</p>
            <p className="text-white/90 mb-4">{t('sharing.legal')}</p>
            <p className="text-white/90">{t('sharing.aggregate')}</p>
          </section>

          {/* Data Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('dataSecurity.title')}</h2>
            <p className="text-white/90 mb-4">{t('dataSecurity.paragraph1')}</p>
            <p className="text-white/90 mb-4">{t('dataSecurity.paragraph2')}</p>
            <p className="text-white/90">{t('dataSecurity.paragraph3')}</p>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('dataRetention.title')}</h2>
            <p className="text-white/90 mb-4">{t('dataRetention.paragraph1')}</p>
            <p className="text-white/90 mb-4">{t('dataRetention.paragraph2')}</p>
            <p className="text-white/90">{t('dataRetention.paragraph3')}</p>
          </section>

          {/* Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('cookies.title')}</h2>
            <p className="text-white/90 mb-4">{t('cookies.paragraph1')}</p>
            <p className="text-white/90 mb-4">{t('cookies.paragraph2')}</p>
            <p className="text-white/90">{t('cookies.paragraph3')}</p>
          </section>

          {/* International Data Transfers */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('international.title')}</h2>
            <p className="text-white/90 mb-4">{t('international.paragraph1')}</p>
            <p className="text-white/90">{t('international.paragraph2')}</p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('children.title')}</h2>
            <p className="text-white/90 mb-4">{t('children.paragraph1')}</p>
            <p className="text-white/90">{t('children.paragraph2')}</p>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('rights.title')}</h2>
            <ul className="text-white/90 space-y-2 ml-4">
              <li>• {t('rights.point1')}</li>
              <li>• {t('rights.point2')}</li>
              <li>• {t('rights.point3')}</li>
              <li>• {t('rights.point4')}</li>
              <li>• {t('rights.point5')}</li>
              <li>• {t('rights.point6')}</li>
            </ul>
          </section>

          {/* Changes */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('changes.title')}</h2>
            <p className="text-white/90 mb-4">{t('changes.paragraph1')}</p>
            <p className="text-white/90 mb-4">{t('changes.paragraph2')}</p>
            <p className="text-white/90">{t('changes.paragraph3')}</p>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('contact.title')}</h2>
            <p className="text-white/90 mb-4">{t('contact.paragraph1')}</p>
            <p className="text-white/80 mb-2">{t('contact.email')}</p>
            <p className="text-white/90">{t('contact.paragraph2')}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
