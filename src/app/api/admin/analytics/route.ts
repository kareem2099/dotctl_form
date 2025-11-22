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

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get daily signup data for last 30 days
    const dailySignups = await BetaUser.aggregate([
      {
        $match: {
          submittedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    // Fill in missing dates with 0 count
    const filledDailySignups = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const existing = dailySignups.find(d => d._id === dateStr);
      filledDailySignups.push({
        date: dateStr,
        count: existing ? existing.count : 0,
        cumulative: 0
      });
    }

    // Calculate cumulative count
    let cumulative = 0;
    const totalUsersBefore = await BetaUser.countDocuments({ submittedAt: { $lt: thirtyDaysAgo } });
    filledDailySignups.forEach(day => {
      cumulative += day.count;
      day.cumulative = cumulative + totalUsersBefore;
    });

    // Get skill level distribution
    const skillStats = await BetaUser.aggregate([
      {
        $group: {
          _id: '$skillLevel',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get referral source distribution
    const referralStats = await BetaUser.aggregate([
      {
        $group: {
          _id: '$referralSource',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get feature interests distribution
    const featureStats = await BetaUser.aggregate([
      {
        $unwind: "$featureInterests"
      },
      {
        $group: {
          _id: "$featureInterests",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get user growth metrics
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const totalUsers = await BetaUser.countDocuments();
    const usersToday = await BetaUser.countDocuments({
      submittedAt: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });
    const usersYesterday = await BetaUser.countDocuments({
      submittedAt: { $gte: yesterday, $lt: today }
    });
    const usersThisWeek = await BetaUser.countDocuments({ submittedAt: { $gte: weekAgo } });
    const usersThisMonth = await BetaUser.countDocuments({ submittedAt: { $gte: monthAgo } });

    const dayOverDayGrowth = usersYesterday > 0 ? ((usersToday - usersYesterday) / usersYesterday) * 100 : 0;

    return NextResponse.json(
      {
        success: true,
        analytics: {
          dailySignups: filledDailySignups,
          skillDistribution: skillStats.map(s => ({ name: s._id, value: s.count })),
          referralDistribution: referralStats.map(r => ({ name: r._id, value: r.count })),
          featureDistribution: featureStats.map(f => ({ name: f._id, value: f.count })),
          metrics: {
            totalUsers,
            usersToday,
            dayOverDayGrowth,
            usersThisWeek,
            usersThisMonth
          }
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
    console.error('Analytics API error:', error);
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
