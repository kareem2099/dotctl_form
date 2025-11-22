import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/mongodb';
import BetaUser from '../../../../../../models/BetaUser';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.toLowerCase().trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user exists in beta system
    const user = await BetaUser.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json(
        { error: 'Email not found in beta system. Please sign up for beta access first.' },
        { status: 404 }
      );
    }

    // Check if user has any referral rewards
    if (user.rewardMonths < 1) {
      return NextResponse.json(
        { error: 'No referral rewards available. Make some referrals first!' },
        { status: 403 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log(`Generated OTP: ${otp} for ${email.trim()}, expires: ${otpExpiry}`);

    // Update user with OTP (temporary field for verification)
    console.log(`Updating user ${user._id} with OTP: ${otp}, expiry: ${otpExpiry}`);
    user.tempOTP = otp;
    user.otpExpiry = otpExpiry;
    user.updatedAt = new Date();

    try {
      await user.save();
      console.log('User saved successfully with OTP');
    } catch (saveError) {
      console.error('Failed to save user with OTP:', saveError);
      return NextResponse.json(
        { error: 'Failed to save OTP. Please try again.' },
        { status: 500 }
      );
    }

    // Send OTP via email
    try {
      const { sendOTPVerificationEmail } = await import('../../../../../../lib/email');
      await sendOTPVerificationEmail(email.trim(), user.name, otp);

      return NextResponse.json({
        success: true,
        message: 'OTP sent to your email',
        valid_for_minutes: 10,
        email: email.toLowerCase().trim()
      });
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Request OTP error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
