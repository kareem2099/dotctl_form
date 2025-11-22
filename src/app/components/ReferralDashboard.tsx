'use client';

import toast from 'react-hot-toast';
import { Trophy, Users, Calendar, Share2, QrCode, Download, Bell, BellOff } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { usePushNotifications } from './usePushNotifications';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

type MilestoneReached = {
  milestone: string;
  achievedAt: Date;
  bonusMonthsGranted: number;
};

type UserData = {
  referralCode: string;
  referralCount: number;
  rewardMonths: number;
  shareLink: string;
  milestonesReached: MilestoneReached[];
  effectiveSubscription: {
    yearsFromReferrals: number;
    remainingMonths: number;
    display: string;
  };
};

type ReferralDashboardProps = {
  userData: UserData;
  resetToDashboard: () => void;
};

type SocialShareProps = {
  referralCode: string;
  shareLink: string;
};

// Social Sharing Buttons component (outside the render function)
function SocialShareButtons({ referralCode, shareLink }: SocialShareProps) {
  const { t } = useTranslation();

  const twitterMessage = t('dashboard.sharing.hashtags.joinBeta', { code: referralCode, link: shareLink });
  const shortMessage = t('dashboard.sharing.hashtags.joinBetaShort', { code: referralCode });

  return (
    <div className="mt-4">
      <p className="text-white/70 text-sm mb-3">{t('dashboard.socialShare.title')}</p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterMessage)}`, '_blank', 'width=550,height=420');
          }}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
        >
          🐦 Twitter
        </button>

        <button
          onClick={() => {
            window.open(
              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}&quote=${encodeURIComponent(shortMessage)}`,
              '_blank',
              'width=600,height=400'
            );
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
        >
          📘 Facebook
        </button>

        <button
          onClick={() => {
            const message = encodeURIComponent(twitterMessage);
            window.open(`https://wa.me/?text=${message}`, '_blank');
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
        >
          💬 WhatsApp
        </button>

        <button
          onClick={() => {
            const linkedInMessage = encodeURIComponent(
              t('dashboard.sharing.hashtags.useCode', { code: referralCode })
            );
            window.open(
              `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}&title=${encodeURIComponent(t('dashboard.sharing.hashtags.ultimateTool'))}&summary=${linkedInMessage}`,
              '_blank',
              'width=600,height=600'
            );
          }}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-sm font-medium transition-colors"
        >
          💼 LinkedIn
        </button>

        <button
          onClick={() => {
            const telegramMessage = encodeURIComponent(t('dashboard.sharing.hashtags.combinedMessage', { code: referralCode, link: shareLink }));
            window.open(`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${telegramMessage}`, '_blank');
          }}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
        >
          ✈️ Telegram
        </button>
      </div>
    </div>
  );
}

export default function ReferralDashboard({ userData, resetToDashboard }: ReferralDashboardProps) {
  const { t } = useTranslation();
  const { requestPermission, isEnabled, sendTestNotification } = usePushNotifications();

  // Milestone definitions for badges and display - using translation keys with fallback
  const getMilestoneName = (key: string) => {
    switch (key) {
      case 'early_influencer':
        return t('dashboard.milestones.earlyInfluencer.name');
      case 'community_builder':
        return t('dashboard.milestones.communityBuilder.name');
      case 'referral_champion':
        return t('dashboard.milestones.referralChampion.name');
      case 'viral_force':
        return t('dashboard.milestones.viralForce.name');
      case 'super_spreader':
        return t('dashboard.milestones.superSpreader.name');
      default:
        return key;
    }
  };

  const getMilestoneReward = (key: string) => {
    switch (key) {
      case 'early_influencer':
        return t('dashboard.milestones.earlyInfluencer.reward');
      case 'community_builder':
        return t('dashboard.milestones.communityBuilder.reward');
      case 'referral_champion':
        return t('dashboard.milestones.referralChampion.reward');
      case 'viral_force':
        return t('dashboard.milestones.viralForce.reward');
      case 'super_spreader':
        return t('dashboard.milestones.superSpreader.reward');
      default:
        return key;
    }
  };

  const MILESTONE_BADGES = {
    early_influencer: { name: getMilestoneName('early_influencer'), icon: '🏆', color: 'purple' },
    community_builder: { name: getMilestoneName('community_builder'), icon: '🏗️', color: 'blue' },
    referral_champion: { name: getMilestoneName('referral_champion'), icon: '👑', color: 'gold' },
    viral_force: { name: getMilestoneName('viral_force'), icon: '⚡', color: 'diamond' },
    super_spreader: { name: getMilestoneName('super_spreader'), icon: '🌟', color: 'legendary' },
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-500 via-purple-500 to-blue-600 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        {isEnabled ? (
          <button
            onClick={sendTestNotification}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Test notification"
          >
            <Bell className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={requestPermission}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Enable notifications"
          >
            <BellOff className="w-5 h-5" />
          </button>
        )}
        <LanguageSwitcher />
      </div>
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl max-w-lg w-full animate-fadeInUp">

        <div className="text-center mb-8">
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">{t('dashboard.referral.accessGranted')}</h1>
          <p className="text-white/90">{t('dashboard.referral.waitlistMessage')}</p>
        </div>

        {userData.referralCode && (
          <div className="mb-6 p-4 bg-white/10 rounded-lg border border-white/20">
            <h3 className="text-white font-semibold mb-3 flex items-center">
              <Share2 className="w-4 h-4 mr-2" />
              {t('dashboard.referral.yourCode')}
            </h3>
            <p className="text-white/90 text-xl font-mono mb-3 text-center py-2 bg-white/5 rounded">
              {userData.referralCode}
            </p>
            <p className="text-white/70 text-sm mb-4 text-center">
              {t('dashboard.referral.shareInstruction')}
            </p>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={userData.shareLink}
                readOnly
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(userData.shareLink);
                  toast.success(t('dashboard.referral.linkCopied'), {
                    duration: 3000,
                    position: 'top-center',
                  });
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              >
                {t('dashboard.referral.copyLink')}
              </button>

              <SocialShareButtons referralCode={userData.referralCode} shareLink={userData.shareLink} />
            </div>
          </div>
        )}

        {userData.referralCode && (
          <div className="mb-6 p-4 bg-white/10 rounded-lg border border-white/20">
            <h3 className="text-white font-semibold mb-3 flex items-center">
              <QrCode className="w-4 h-4 mr-2" />
              {t('dashboard.referral.qrCode')}
            </h3>
            <p className="text-white/70 text-sm mb-4 text-center">
              {t('dashboard.referral.qrDescription')}
            </p>

            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-3 rounded-lg border border-white/20 shadow-lg">
                <QRCodeCanvas
                  value={userData.shareLink}
                  size={120}
                  bgColor="#ffffff"
                  fgColor="#2563eb"
                  level="M"
                  includeMargin={true}
                />
              </div>

              <div className="flex gap-2 w-full">
                <button
                  onClick={async () => {
                    try {
                      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
                      if (canvas) {
                        const url = canvas.toDataURL('image/png');
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `dotctl-referral-${userData.referralCode}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        toast.success('QR Code downloaded! 📱', {
                          duration: 3000,
                          position: 'top-center',
                        });
                      }
                    } catch {
                      toast.error('Failed to download QR code', {
                        duration: 3000,
                        position: 'top-center',
                      });
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t('dashboard.referral.downloadQr')}
                </button>

                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <title>DotCTL Referral - ${userData.referralCode}</title>
                          <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 40px; background: white; }
                            .qr-container { margin: 20px auto; display: inline-block; background: white; padding: 20px; border: 2px solid #2563eb; border-radius: 10px; }
                            h1 { color: #2563eb; margin-bottom: 10px; }
                            .code { font-family: monospace; font-size: 24px; font-weight: bold; color: #1f2937; background: #f3f4f6; padding: 10px; border-radius: 5px; margin: 10px 0; }
                            .info { color: #6b7280; font-size: 14px; }
                          </style>
                        </head>
                        <body>
                          <h1>🚀 Join DotCTL Beta</h1>
                          <div class="qr-container">
                            <img src="${document.querySelector('canvas')?.toDataURL()}" alt="QR Code" />
                          </div>
                          <div class="code">${userData.referralCode}</div>
                          <p class="info">Scan this code or visit the link to join our beta program!</p>
                          <p class="info">Referral code: ${userData.referralCode}</p>
                        </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.focus();
                      printWindow.print();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  {t('dashboard.referral.printCard')}
                </button>
              </div>

              <p className="text-white/50 text-xs text-center">
                {t('dashboard.referral.qrTip')}
              </p>
            </div>
          </div>
        )}

        {userData.milestonesReached && userData.milestonesReached.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3">{t('dashboard.achievements.title')}</h3>
            <div className="flex flex-wrap gap-3">
              {userData.milestonesReached.map((milestone, index) => {
                const badgeData = MILESTONE_BADGES[milestone.milestone as keyof typeof MILESTONE_BADGES];
                if (!badgeData) return null;

                return (
                  <div
                    key={`${milestone.milestone}-${index}`}
                    className={`px-4 py-2 rounded-lg border ${
                      badgeData.color === 'purple' ? 'bg-purple-600/20 border-purple-400' :
                      badgeData.color === 'blue' ? 'bg-blue-600/20 border-blue-400' :
                      badgeData.color === 'gold' ? 'bg-yellow-600/20 border-yellow-400' :
                      badgeData.color === 'diamond' ? 'bg-cyan-600/20 border-cyan-400' :
                      'bg-orange-600/20 border-orange-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{badgeData.icon}</span>
                      <div>
                        <div className="text-white font-semibold text-sm">{badgeData.name}</div>
                        <div className="text-white/70 text-xs">+{milestone.bonusMonthsGranted} months!</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-white/10 rounded-lg border border-white/20 text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-white/60 text-sm">{t('dashboard.stats.referrals')}</p>
            <p className="text-white text-2xl font-bold">{userData.referralCount}</p>
          </div>
          <div className="p-4 bg-white/10 rounded-lg border border-white/20 text-center">
            <Calendar className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-white/60 text-sm">{t('dashboard.stats.rewardMonths')}</p>
            <p className="text-white text-2xl font-bold">{userData.rewardMonths}</p>
          </div>
        </div>

        {(() => {
          const milestones = [
            { key: 'early_influencer', threshold: 5, reward: getMilestoneReward('early_influencer'), displayName: getMilestoneName('early_influencer') },
            { key: 'community_builder', threshold: 10, reward: getMilestoneReward('community_builder'), displayName: getMilestoneName('community_builder') },
            { key: 'referral_champion', threshold: 25, reward: getMilestoneReward('referral_champion'), displayName: getMilestoneName('referral_champion') },
            { key: 'viral_force', threshold: 50, reward: getMilestoneReward('viral_force'), displayName: getMilestoneName('viral_force') },
            { key: 'super_spreader', threshold: 100, reward: getMilestoneReward('super_spreader'), displayName: getMilestoneName('super_spreader') },
          ];

          const achievedMilestoneKeys = userData.milestonesReached ? userData.milestonesReached.map(m => m.milestone) : [];
          const nextMilestone = milestones.find(m => !achievedMilestoneKeys.includes(m.key) && m.threshold > userData.referralCount - 1);

          if (nextMilestone) {
            const remaining = nextMilestone.threshold - userData.referralCount;
            const progressPercent = (userData.referralCount / nextMilestone.threshold) * 100;

            return (
              <div className="mb-6 p-4 bg-linear-to-r from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-400/30">
                <h3 className="text-white font-semibold mb-2 flex items-center">
                  🎯 {t('dashboard.milestones.progressTo', { milestone: nextMilestone.displayName })}
                </h3>
                <div className="w-full bg-white/20 rounded-full h-3 mb-2 overflow-hidden">
                  <div
                    className="bg-linear-to-r from-indigo-400 to-purple-400 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                  ></div>
                </div>
                <p className="text-white/70 text-sm mb-1">
                  {remaining === 1 ? t('dashboard.progress.remaining') : t('dashboard.progress.remainingPlural', { count: remaining })}
                </p>
                <p className="text-indigo-300 text-xs">
                  {t('dashboard.progress.reward', { reward: nextMilestone.reward })}
                </p>
              </div>
            );
          }
          return null;
        })()}

        {userData.effectiveSubscription.display && (
          <div className="mb-6 p-4 bg-linear-to-r from-green-500/20 to-blue-500/20 rounded-lg border border-green-400/30">
            <h3 className="text-white font-semibold mb-2 flex items-center">
              <Trophy className="w-4 h-4 mr-2 text-yellow-400" />
              {t('dashboard.subscription.title')}
            </h3>
            <p className="text-green-400 font-semibold">{userData.effectiveSubscription.display}</p>
            <p className="text-white/70 text-xs mt-1">
              {userData.rewardMonths === 1
                ? t('dashboard.subscription.earnedFrom')
                : t('dashboard.subscription.earnedFromPlural', { count: userData.rewardMonths })}
            </p>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={resetToDashboard}
            className="text-white/60 hover:text-white underline text-sm transition-colors"
          >
            {t('dashboard.Actions.notYourAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}
