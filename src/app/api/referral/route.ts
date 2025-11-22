import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import BetaUser from '../../../../models/BetaUser';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await BetaUser.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate effective subscription
    const { referralCount, rewardMonths } = user;
    const yearsEarned = Math.floor(rewardMonths / 12);
    const remainingMonths = rewardMonths % 12;

    const effectiveSubscription = {
      totalRewardMonths: rewardMonths,
      yearsFromReferrals: yearsEarned,
      remainingMonths: remainingMonths,
      display: yearsEarned > 0
        ? `${yearsEarned} year${yearsEarned > 1 ? 's' : ''} ${remainingMonths > 0 ? `+ ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''} free pro access`
        : `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''} free pro access`
    };

    return NextResponse.json({
      referralCode: user.referralCode,
      referralCount,
      rewardMonths,
      effectiveSubscription,
      shareLink: `${request.nextUrl.origin}?ref=${user.referralCode}`
    });

  } catch (error) {
    console.error('Referral stats error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
