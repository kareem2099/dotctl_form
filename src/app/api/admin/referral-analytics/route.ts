import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import BetaUser from '../../../../../models/BetaUser';

interface MilestoneData {
  milestone: string;
  achievedAt: Date;
  bonusMonthsGranted: number;
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin auth
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get all users for analytics
    const allUsers = await BetaUser.find({}).sort({ submittedAt: -1 });

    // Calculate total referrals (sum of all referralCount values)
    const totalReferrals = allUsers.reduce((sum, user) => sum + user.referralCount, 0);

    // Calculate total reward months earned
    const totalReferralRewards = allUsers.reduce((sum, user) => sum + user.rewardMonths, 0);

    // Count active referrers (users who have made at least 1 referral)
    const activeReferrers = allUsers.filter(user => user.referralCount > 0).length;

    // Calculate conversion rate (users with referrals / total users)
    const conversionRate = allUsers.length > 0 ? Math.round((activeReferrers / allUsers.length) * 100) : 0;

    // Get top referrers sorted by referralCount
    const topReferrers = allUsers
      .filter(user => user.referralCount > 0)
      .sort((a, b) => b.referralCount - a.referralCount)
      .slice(0, 10)
      .map(user => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        referralCount: user.referralCount,
        rewardMonths: user.rewardMonths
      }));

    // Get recent referrals (users who were referred in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReferrals = allUsers
      .filter(user => user.referredBy && user.submittedAt >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 5)
      .map(user => {
        // Find the referrer info
        const referrer = allUsers.find(u => u.email === user.referredBy);
        return {
          referrerName: referrer ? referrer.name : 'Unknown',
          referrerEmail: referrer ? referrer.email : user.referredBy || 'Unknown',
          referredName: user.name,
          referredEmail: user.email,
          referredAt: user.submittedAt.toISOString()
        };
      });

    // Calculate referral trends for last 7 days
    const referralTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // Count referrals made on this day (not users signed up, but successful referrals)
      // We need to count referrals that were attributed on this day
      const referralsOnDay = allUsers
        .filter(user =>
          user.referredBy &&
          user.submittedAt >= dayStart &&
          user.submittedAt <= dayEnd
        ).length;

      const cumulativeUpToDay = allUsers
        .filter(user =>
          user.referredBy &&
          user.submittedAt <= dayEnd
        ).length;

      referralTrends.push({
        date: dayStart.toISOString().split('T')[0], // YYYY-MM-DD format
        referrals: referralsOnDay,
        cumulative: cumulativeUpToDay
      });
    }

    // Calculate achievement distribution
    const achievementStats = [
      { milestone: 'early_influencer', count: 0, reward: '2 bonus months' },
      { milestone: 'community_builder', count: 0, reward: '3 bonus months' },
      { milestone: 'referral_champion', count: 0, reward: '5 bonus months' },
      { milestone: 'viral_force', count: 0, reward: '10 bonus months' },
      { milestone: 'super_spreader', count: 0, reward: '20 bonus months' }
    ];

    allUsers.forEach(user => {
      user.milestonesReached?.forEach((milestone: MilestoneData) => {
        const achievement = achievementStats.find(a => a.milestone === milestone.milestone);
        if (achievement) {
          achievement.count += 1;
        }
      });
    });

    const responseData = {
      totalReferrals,
      totalReferralRewards,
      activeReferrers,
      conversionRate,
      topReferrers,
      recentReferrals,
      referralTrends,
      achievementStats
    };

    return NextResponse.json({
      analytics: responseData
    });

  } catch (error) {
    console.error('Referral analytics error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
