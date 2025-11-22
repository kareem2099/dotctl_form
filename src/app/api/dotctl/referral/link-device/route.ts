import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/mongodb';
import BetaUser, { IDeviceLink } from '../../../../../../models/BetaUser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;
    // Support both camelCase (API spec) and snake_case (Python client) field names
    const hardwareId = body.hardwareId || body.hardware_id;

    // Validate inputs
    if (!email || !otp || !hardwareId) {
      return NextResponse.json(
        { error: 'Email, OTP, and hardware ID are required' },
        { status: 400 }
      );
    }

    // Validate hardware ID format (basic validation)
    if (hardwareId.length < 10 || hardwareId.length > 200) {
      return NextResponse.json(
        { error: 'Invalid hardware ID format' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user exists (include tempOTP fields for verification)
    const user = await BetaUser.findOne({ email: email.toLowerCase().trim() }).select('+tempOTP +otpExpiry');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify OTP
    console.log(`OTP Verification: submitted=${otp}, stored=${user.tempOTP}, expiry=${user.otpExpiry}`);
    if (!user.tempOTP || user.tempOTP !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP code' },
        { status: 401 }
      );
    }

    // Check if OTP is expired
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return NextResponse.json(
        { error: 'OTP code has expired. Please request a new one.' },
        { status: 401 }
      );
    }

    // Check if device is already linked to this user
    const existingDevice = user.linkedDevices?.find(
      (device: IDeviceLink) => device.hardwareId === hardwareId
    );

    if (existingDevice) {
      return NextResponse.json(
        { error: 'This device is already linked to your account' },
        { status: 409 }
      );
    }

    // Check if device is linked to another user
    const deviceLinkedToOther = await BetaUser.findOne({
      'linkedDevices.hardwareId': hardwareId
    });

    if (deviceLinkedToOther) {
      return NextResponse.json(
        { error: 'This device is already linked to another account' },
        { status: 409 }
      );
    }

    // Calculate license expiration based on referral months
    const currentRewardMonths = user.rewardMonths;
    let licenseExpiry: Date;

    if (currentRewardMonths >= 12) {
      // For 12+ months, give 1 year license
      licenseExpiry = new Date();
      licenseExpiry.setFullYear(licenseExpiry.getFullYear() + 1);
    } else {
      // For less than 12 months, give proportional license
      const monthsToAdd = Math.max(1, currentRewardMonths); // Minimum 1 month
      licenseExpiry = new Date();
      licenseExpiry.setMonth(licenseExpiry.getMonth() + monthsToAdd);
    }

    // Generate license key
    const licenseKey = `REFERRAL-DOTCTL-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Date.now()}`;

    // Create device link object
    const deviceLink = {
      hardwareId,
      linkedAt: new Date(),
      lastChecked: new Date(),
      referralSnapshot: {
        monthsUsedForLicense: currentRewardMonths >= 12 ? 0 : currentRewardMonths, // Don't consume if >= 12 months
        remainingRewardMonths: currentRewardMonths >= 12 ? currentRewardMonths : 0,
        lastLicenseKey: licenseKey
      }
    };

    // Update user with new device link and clear OTP
    await BetaUser.updateOne(
      { _id: user._id },
      {
        $push: { linkedDevices: deviceLink },
        $unset: { tempOTP: 1, otpExpiry: 1 },
        $set: { updatedAt: new Date() }
      }
    );

    // Log the linking event
    console.log(`Device linked: ${hardwareId} -> ${email}, License: ${licenseKey}`);

    return NextResponse.json({
      success: true,
      license_key: licenseKey,
      licensed_email: email.toLowerCase().trim(),
      expires_at: licenseExpiry.toISOString(),
      hardware_linked: true,
      referral_months_used: currentRewardMonths >= 12 ? 0 : currentRewardMonths,
      remaining_benefits: currentRewardMonths >= 12 ?
        "lifetime_via_referrals" :
        `lifetime_available_via_referrals`
    });

  } catch (error) {
    console.error('Link device error:', error);
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
