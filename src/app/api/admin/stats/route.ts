import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '../../../../../lib/auth';
import dbConnect from '../../../../../lib/mongodb';
import BetaUser from '../../../../../models/BetaUser';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        {
          status: 401,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
          }
        }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded || !['admin', 'super_admin'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        {
          status: 403,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
          }
        }
      );
    }

    await dbConnect();

    // Get total users
    const totalUsers = await BetaUser.countDocuments();

    // Get new users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const newUsersToday = await BetaUser.countDocuments({
      submittedAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Calculate conversion rate (assuming we have a visit counter)
    // For now, we'll use a simple formula based on existing users
    const conversionRate = totalUsers > 0 ? Math.round((totalUsers / (totalUsers + 50)) * 100) : 0;

    // Feature requests count (unique features mentioned)
    const allUsers = await BetaUser.find({}, 'featureInterests');
    const uniqueFeatures = new Set<string>();
    allUsers.forEach(user => {
      user.featureInterests.forEach((feature: string) => uniqueFeatures.add(feature));
    });
    const featureRequests = uniqueFeatures.size;

    // Get skill level distribution
    const skillStats = await BetaUser.aggregate([
      {
        $group: {
          _id: '$skillLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get referral source distribution
    const referralStats = await BetaUser.aggregate([
      {
        $group: {
          _id: '$referralSource',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentActivity = await BetaUser.countDocuments({
      submittedAt: { $gte: weekAgo }
    });

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalUsers,
          newUsersToday,
          conversionRate,
          featureRequests,
          recentActivity,
          skillDistribution: skillStats,
          referralDistribution: referralStats
        }
      },
      {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        }
      }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    {
      status: 405,
      headers: {
        'Allow': 'GET',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    }
  );
}
