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
      return NextResponse.json({ registered: false });
    }

    // Generate referral code for legacy users who don't have one
    let { referralCode } = user;
    if (!referralCode) {
      // Generate new referral code starting with DOTCTL
      let attempts = 0;
      do {
        const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
        referralCode = `DOTCTL${randomPart}`;
        attempts++;
        if (attempts > 100) {
          return NextResponse.json(
            { error: 'Unable to generate unique referral code. Please try again.' },
            { status: 500 }
          );
        }
      } while (await BetaUser.findOne({ referralCode }));

      // Update user with new referral code
      await BetaUser.updateOne(
        { _id: user._id },
        { $set: { referralCode, updatedAt: new Date() } }
      );
    }

    // Calculate effective subscription
    const { referralCount, rewardMonths } = user;
    const yearsEarned = Math.floor(rewardMonths / 12);
    const remainingMonths = rewardMonths % 12;

    // Get milestone achievements
    const { milestonesReached } = user;

    return NextResponse.json({
      registered: true,
      referralCode,
      referralCount,
      rewardMonths,
      shareLink: `${request.nextUrl.origin}?ref=${referralCode}`,
      milestonesReached,
      effectiveSubscription: {
        yearsFromReferrals: yearsEarned,
        remainingMonths: remainingMonths,
        display: yearsEarned > 0
          ? `${yearsEarned} year${yearsEarned > 1 ? 's' : ''} ${remainingMonths > 0 ? `+ ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''} free pro access`
          : `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''} free pro access`
      }
    });

  } catch (error) {
    console.error('Check user error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
