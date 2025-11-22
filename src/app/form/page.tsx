'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Loader2, CheckCircle, ArrowRight, ArrowLeft, UserCheck, Target } from 'lucide-react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import 'react-phone-number-input/style.css';

type TranslationFunc = (key: string) => string;

const formSchema = (t: TranslationFunc) => z.object({
  name: z.string()
    .min(2, t('validation.name.min'))
    .max(50, t('validation.name.max'))
    .regex(/^[a-zA-Z\s'-]+$/, t('validation.name.regex'))
    .transform(str => str.trim()),

  email: z.string()
    .min(1, t('validation.email.required'))
    .email(t('validation.email.invalid'))
    .max(254, t('validation.email.max'))
    .refine(email => {
      const localPart = email.split('@')[0];
      return localPart.length <= 64 && !localPart.includes('..');
    }, t('validation.email.format')),

  phone: z.string()
    .min(10, t('validation.phone.min'))
    .max(15, t('validation.phone.max'))
    .regex(/^\+?[\d\s\-\(\)]+$/, t('validation.phone.regex'))
    .transform(phone => phone.replace(/[\s\-\(\)]/g, '')), // Remove formatting

  useCase: z.string()
    .min(10, t('validation.useCase.min'))
    .max(500, t('validation.useCase.max'))
    .refine(useCase => {
      const spamWords = ['test', 'spam', 'free', 'money', 'win', 'prize'];
      return !spamWords.some(word => useCase.toLowerCase().includes(word));
    }, t('validation.useCase.spam')),

  skillLevel: z.enum(['beginner', 'intermediate', 'advanced'])
    .refine(val => val !== undefined, {
      message: t('fields.skillLevel.required')
    }),

  featureInterests: z.array(z.enum(['arp_spoofing', 'bandwidth_limiting', 'traffic_monitoring', 'dns_spoofing', 'content_injection', 'session_hijacking', 'deep_packet_inspection', 'stealth_features', 'ml_traffic_analysis']))
    .min(1, t('fields.features.required'))
    .max(5, t('fields.features.max')),

  referralSource: z.enum(['github', 'stackoverflow', 'twitter', 'linkedin', 'reddit', 'hacker_news', 'search', 'friend', 'article', 'other'])
    .refine(val => val !== undefined, {
      message: t('fields.referral.required')
    }),

  wantsUpdates: z.boolean(),
}).refine(data => {
  // Cross-field validation: if skill level is advanced, ensure they selected at least 2 advanced features
  if (data.skillLevel === 'advanced' && data.featureInterests.length < 2) {
    return false;
  }
  return true;
}, {
  message: t('fields.features.advanced'),
  path: ['featureInterests']
});

type FormData = z.infer<ReturnType<typeof formSchema>>;

const steps = [
  {
    id: 1,
    title: 'Personal Info',
    icon: User,
    fields: ['name', 'email', 'phone']
  },
  {
    id: 2,
    title: 'About You',
    icon: UserCheck,
    fields: ['skillLevel', 'useCase']
  },
  {
    id: 3,
    title: 'Interests',
    icon: Target,
    fields: ['featureInterests', 'referralSource', 'wantsUpdates']
  }
];

function ProgressIndicator({ currentStep }: { currentStep: number }) {
  const { t } = useTranslation('form');

  const stepTitles = [
    t('steps.personal'),
    t('steps.about'),
    t('steps.interests')
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const IconComponent = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                isCompleted ? 'bg-green-500' :
                isCurrent ? 'bg-white/30 border-2 border-white' : 'bg-white/10'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : (
                  <IconComponent className={`w-5 h-5 ${isCurrent ? 'text-white' : 'text-white/60'}`} />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 transition-all duration-300 ${
                  isCompleted ? 'bg-green-500' : 'bg-white/20'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-1">
          {stepTitles[currentStep - 1]}
        </h3>
        <p className="text-white/70 text-sm">
          {t('steps.step')} {currentStep} {t('steps.of')} {steps.length}
        </p>
      </div>
    </div>
  );
}

export default function FormPage() {
  const router = useRouter();
  const { t } = useTranslation('form');
  const { t: commonT } = useTranslation('common');

  const schema = useMemo(() => formSchema(t), [t]);

  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  const [savedStatus, setSavedStatus] = useState('');
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [submitResult, setSubmitResult] = useState<{
    referralCode?: string;
    referralLink?: string;
    rewardInfo?: {
      currentRewards: number;
      conversionRule: string;
    };
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      useCase: '',
      skillLevel: 'beginner',
      featureInterests: [],
      referralSource: 'other',
      wantsUpdates: true,
    }
  });

  const featureInterests = watch('featureInterests') as string[];

  // Load saved draft on component mount and check for referral code
  useEffect(() => {
    const savedData = localStorage.getItem('betaFormDraft');
    const savedStep = localStorage.getItem('betaFormStep');
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (savedData) {
      setHasSavedDraft(true);
      try {
        const parsedData = JSON.parse(savedData);
        Object.keys(parsedData).forEach(key => {
          setValue(key as keyof FormData, parsedData[key]);
        });
      } catch (error) {
        console.warn('Failed to load saved draft:', error);
      }
    }

    if (savedStep) {
      setCurrentStep(parseInt(savedStep, 10));
    }

    // Set referral code from URL or saved draft
    if (refCode) {
      setReferralCode(refCode);
    } else if (savedData) {
      const parsedData = JSON.parse(savedData);
      setReferralCode(parsedData.referralCode || '');
    }
  }, [setValue]);

  // Auto-save form data when it changes
  useEffect(() => {
    const subscription = watch((data) => {
      localStorage.setItem('betaFormDraft', JSON.stringify(data));
      localStorage.setItem('betaFormStep', currentStep.toString());
      setSavedStatus(commonT('status.saved'));
      // Clear saved status after 2 seconds
      setTimeout(() => setSavedStatus(''), 2000);
    });

    return () => subscription.unsubscribe();
  }, [watch, currentStep, commonT]);

  const clearDraft = () => {
    localStorage.removeItem('betaFormDraft');
    localStorage.removeItem('betaFormStep');
    reset();
    setCurrentStep(1);
    setSavedStatus(commonT('status.cleared'));
    setTimeout(() => setSavedStatus(''), 2000);
  };

  const handleFeatureChange = (value: string, checked: boolean) => {
    const newInterests = checked
      ? [...featureInterests, value]
      : featureInterests.filter(f => f !== value);
    setValue('featureInterests', newInterests as ('arp_spoofing' | 'bandwidth_limiting' | 'traffic_monitoring' | 'dns_spoofing' | 'content_injection' | 'session_hijacking' | 'deep_packet_inspection' | 'stealth_features' | 'ml_traffic_analysis')[]);
  };

  const nextStep = async () => {
    const currentStepFields = steps[currentStep - 1].fields;
    const isValid = await trigger(currentStepFields as (keyof FormData)[]);

    if (currentStep < steps.length && isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, referralCode }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitResult(result);
        setSubmitted(true);
        reset();
        setReferralCode('');
        localStorage.setItem('betaUserEmail', data.email);
        // Clear draft data after successful submission
        localStorage.removeItem('betaFormDraft');
        localStorage.removeItem('betaFormStep');
        router.push('/dashboard');
      } else {
        setError(result.error || 'Something went wrong');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    const shareLink = `${window.location.origin}?ref=${submitResult?.referralCode || ''}`;

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
            Home
          </Link>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl text-center max-w-md w-full animate-fadeInUp">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Thank you!</h2>
          <p className="text-white/90 leading-relaxed mb-6">You&apos;ve been added to the Try DotCTL beta access list. We&apos;ll be in touch soon!</p>

          {submitResult?.referralCode && (
            <div className="mb-6 p-4 bg-white/10 rounded-lg border border-white/20">
              <h3 className="text-white font-semibold mb-2">Your Referral Code</h3>
              <p className="text-white/90 text-lg font-mono mb-3">{submitResult.referralCode}</p>
              <p className="text-white/70 text-sm mb-4">Share this code or link with friends to earn free pro months!</p>

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    toast.success('Share link copied to clipboard! 🙌', {
                      duration: 3000,
                      position: 'top-center',
                    });
                  }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
                >
                  Copy Share Link
                </button>
              </div>

              {submitResult.rewardInfo && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-white/70 text-xs">{submitResult.rewardInfo.conversionRule}</p>
                  <p className="text-green-400 text-sm font-semibold">Current Reward Months: {submitResult.rewardInfo.currentRewards}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors duration-200"
            >
              View Your Dashboard →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-500 via-purple-500 to-blue-600 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      <div className="absolute top-4 left-4 z-10">
        <Link
          href="/home"
          className="inline-flex items-center px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Home
        </Link>
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl max-w-2xl w-full animate-fadeInUp relative">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{t('header.title')}</h1>
          <p className="text-white/90">{t('header.subtitle')}</p>
        </div>

        <ProgressIndicator currentStep={currentStep} />

        {/* Auto-save Status & Clear Draft */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            {savedStatus && (
              <p className="text-green-400 text-sm text-center transition-opacity duration-300">
                {savedStatus}
              </p>
            )}
          </div>
          {(hasSavedDraft || currentStep > 1) && (
            <button
              type="button"
              onClick={clearDraft}
              className="text-sm text-white/70 hover:text-white underline transition-colors duration-200"
            >
              {t('header.clearDraft')}
            </button>
          )}
        </div>

        {error && <p className="text-red-300 text-center mb-4">{error}</p>}

        <form onSubmit={currentStep === steps.length ? handleSubmit(onSubmit) : (e) => { e.preventDefault(); nextStep(); }} className="space-y-6 transition-all duration-300" noValidate>
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                  <input
                    {...register('name')}
                    type="text"
                    placeholder={t('fields.name.placeholder')}
                    className={`w-full pl-12 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/60 focus:outline-none transition-all duration-200 backdrop-blur-sm ${
                      errors.name ? 'border-red-400 focus:ring-red-400 focus:ring-2' : 'border-white/20 focus:ring-white/40 focus:ring-2'
                    }`}
                  />
                </div>
                {!errors.name && watch('name') && watch('name').length > 2 && (
                  <p className="text-green-400 text-sm mt-1 ml-12">{t('fields.name.valid')}</p>
                )}
                {errors.name && (
                  <p className="text-red-300 text-sm mt-1 ml-12">✗ {errors.name.message}</p>
                )}
              </div>

              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder={t('fields.email.placeholder')}
                    className={`w-full pl-12 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/60 focus:outline-none transition-all duration-200 backdrop-blur-sm ${
                      errors.email ? 'border-red-400 focus:ring-red-400 focus:ring-2' : 'border-white/20 focus:ring-white/40 focus:ring-2'
                    }`}
                  />
                </div>
                {!errors.email && watch('email') && watch('email').includes('@') && (
                  <p className="text-green-400 text-sm mt-1 ml-12">{t('fields.email.valid')}</p>
                )}
                {errors.email && (
                  <p className="text-red-300 text-sm mt-1 ml-12">✗ {errors.email.message}</p>
                )}
              </div>

              <div className="phone-input-container">
                <PhoneInput
                  international
                  defaultCountry="US"
                  value={phone}
                  onChange={(value) => {
                    setPhone(value || '');
                    setValue('phone', value || '');
                  }}
                  className="custom-phone-input"
                  smartCaret={true}
                />
                {!errors.phone && phone && isValidPhoneNumber(phone) && (
                  <p className="text-green-400 text-sm mt-1">✓ {t('fields.phone.valid')}</p>
                )}
                {phone && !isValidPhoneNumber(phone) && (
                  <p className="text-red-300 text-sm mt-1">{t('fields.phone.invalid')}</p>
                )}
                {errors.phone && (
                  <p className="text-red-300 text-sm mt-1">✗ {errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Referral Code <span className="text-white/60">(optional)</span>
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Enter referral code if you have one"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all duration-200 backdrop-blur-sm uppercase"
                />
                <p className="text-white/60 text-xs mt-1">
                  If someone referred you, enter their code here to help them earn rewards
                </p>
              </div>
            </div>
          )}

          {/* Step 2: About You */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="useCase" className="block text-sm font-medium text-white/90 mb-2">
                  {t('fields.useCase.label')} *
                  <span className="float-right text-xs text-white/60">
                    {watch('useCase')?.length || 0}/500 characters
                  </span>
                </label>
                <textarea
                  id="useCase"
                  {...register('useCase')}
                  rows={4}
                  placeholder={t('fields.useCase.placeholder')}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/60 focus:outline-none transition-all duration-200 backdrop-blur-sm resize-none ${
                    errors.useCase ? 'border-red-400 focus:ring-red-400 focus:ring-2' : 'border-white/20 focus:ring-white/40 focus:ring-2'
                  }`}
                />
                {!errors.useCase && watch('useCase') && watch('useCase').length >= 10 && (
                  <p className="text-green-400 text-sm mt-1">✓ Valid use case description</p>
                )}
                {errors.useCase && (
                  <p className="text-red-300 text-sm mt-1">✗ {errors.useCase.message}</p>
                )}
                {watch('useCase')?.length > 450 && (
                  <p className="text-orange-400 text-xs mt-1">
                    Warning: Close to character limit ({watch('useCase').length}/500)
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="skillLevel" className="block text-sm font-medium text-white/90 mb-2">{t('fields.skillLevel.label')}</label>
                <select
                  id="skillLevel"
                  {...register('skillLevel')}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none transition-all duration-200 backdrop-blur-sm ${
                    errors.skillLevel ? 'border-red-400 focus:ring-red-400 focus:ring-2' : 'border-white/20 focus:ring-white/40 focus:ring-2'
                  }`}
                >
                  <option value="beginner" className="bg-purple-900">{t('fields.skillLevel.beginner')}</option>
                  <option value="intermediate" className="bg-purple-900">{t('fields.skillLevel.intermediate')}</option>
                  <option value="advanced" className="bg-purple-900">{t('fields.skillLevel.advanced')}</option>
                </select>
                {errors.skillLevel && (
                  <p className="text-red-300 text-sm mt-1">✗ {errors.skillLevel.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Interests */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-3">{t('fields.features.label')} *</label>
                <div className="space-y-2">
                  {[
                    'arp_spoofing',
                    'bandwidth_limiting',
                    'traffic_monitoring',
                    'dns_spoofing',
                    'content_injection',
                    'session_hijacking',
                    'deep_packet_inspection',
                    'stealth_features',
                    'ml_traffic_analysis',
                  ].map((value) => (
                    <label key={value} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        value={value}
                        checked={featureInterests.includes(value)}
                        onChange={(e) => handleFeatureChange(value, e.target.checked)}
                        className="w-4 h-4 text-purple-600 bg-white/10 border border-white/20 rounded focus:ring-white/40 focus:ring-2 backdrop-blur-sm"
                      />
                      <span className="text-sm text-white/90">{t('fields.features.' + value)}</span>
                    </label>
                  ))}
                </div>
                {errors.featureInterests && (
                  <p className="text-red-300 text-sm mt-1">{errors.featureInterests.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="referralSource" className="block text-sm font-medium text-white/90 mb-2">{t('fields.referral.label')}</label>
                <select
                  id="referralSource"
                  {...register('referralSource')}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all duration-200 backdrop-blur-sm"
                >
                  <option value="github" className="bg-purple-900">{t('fields.referral.github')}</option>
                  <option value="stackoverflow" className="bg-purple-900">{t('fields.referral.stackoverflow')}</option>
                  <option value="twitter" className="bg-purple-900">{t('fields.referral.twitter')}</option>
                  <option value="linkedin" className="bg-purple-900">{t('fields.referral.linkedin')}</option>
                  <option value="reddit" className="bg-purple-900">{t('fields.referral.reddit')}</option>
                  <option value="hacker_news" className="bg-purple-900">{t('fields.referral.hacker_news')}</option>
                  <option value="search" className="bg-purple-900">{t('fields.referral.search')}</option>
                  <option value="friend" className="bg-purple-900">{t('fields.referral.friend')}</option>
                  <option value="article" className="bg-purple-900">{t('fields.referral.article')}</option>
                  <option value="other" className="bg-purple-900">{t('fields.referral.other')}</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  id="wantsUpdates"
                  type="checkbox"
                  {...register('wantsUpdates')}
                  className="w-4 h-4 text-purple-600 bg-white/10 border border-white/20 rounded focus:ring-white/40 focus:ring-2 backdrop-blur-sm"
                />
                <label htmlFor="wantsUpdates" className="text-sm text-white/90">
                  {t('fields.updates.label')}
                </label>
              </div>

              {/* Terms and Privacy Links */}
              <div className="text-xs text-white/60 mt-6">
                <p>
                  {t('agreement.prefix')}{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-white transition-colors duration-200"
                  >
                    {t('agreement.termsLink')}
                  </a>
                  {' '}{t('agreement.and')}{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-white transition-colors duration-200"
                  >
                    {t('agreement.privacyLink')}
                  </a>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex space-x-4 pt-6">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 py-3 px-6 bg-white/10 text-white font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200 flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('fields.buttons.back')}
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`${
                currentStep > 1 ? 'flex-1' : 'w-full'
              } py-3 px-6 bg-linear-to-r from-white to-white/90 text-purple-700 font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-white/90 hover:to-white transform transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('fields.buttons.submitting')}
                </>
              ) : currentStep === steps.length ? (
                t('fields.buttons.submit')
              ) : (
                <>
                  {t('fields.buttons.next')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
