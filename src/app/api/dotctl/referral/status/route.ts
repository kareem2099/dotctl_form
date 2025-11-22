import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/mongodb';
import BetaUser, { IDeviceLink } from '../../../../../../models/BetaUser';

interface ReferralStatusResponse {
  linked: boolean;
  email?: string;
  status: string;
  last_license_key?: string;
  total_reward_months?: number;
  used_for_license?: number;
  remaining_months?: number;
  additional_available?: number;
  last_checked?: Date;
  linked_at?: Date;
  can_extend?: boolean;
  extension_available?: {
    type: string;
    months: number;
    new_expires_at: string;
  };
  message?: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hardwareId = searchParams.get('hardware_id');

    if (!hardwareId) {
      return NextResponse.json(
        { error: 'Hardware ID parameter is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user with this hardware ID linked
    const user = await BetaUser.findOne({
      'linkedDevices.hardwareId': hardwareId
    });

    if (!user) {
      return NextResponse.json({
        linked: false,
        status: 'free',
        message: 'Device not linked to any referral account'
      });
    }

    // Find the specific device link
    const deviceLink = user.linkedDevices?.find(
      (device: IDeviceLink) => device.hardwareId === hardwareId
    );

    if (!deviceLink) {
      return NextResponse.json({
        linked: false,
        status: 'free',
        error: 'Device link corrupted'
      });
    }

    // Get current referral status
    const currentRewardMonths = user.rewardMonths;
    const { monthsUsedForLicense, remainingRewardMonths, lastLicenseKey } = deviceLink.referralSnapshot;

    // Check if we need to extend license (user got more referrals after initial linking)
    const additionalMonths = currentRewardMonths - monthsUsedForLicense - remainingRewardMonths;

    // Prepare status response
    const statusResponse: ReferralStatusResponse = {
      linked: true,
      email: user.email,
      status: 'premium', // Always premium if linked (referral system manages this)
      last_license_key: lastLicenseKey,
      total_reward_months: currentRewardMonths,
      used_for_license: monthsUsedForLicense,
      remaining_months: remainingRewardMonths,
      additional_available: Math.max(0, additionalMonths),
      last_checked: deviceLink.lastChecked,
      linked_at: deviceLink.linkedAt,
      can_extend: additionalMonths > 0
    };

    // If there are additional months available, provide extension info
    if (additionalMonths > 0) {
      // Calculate new expiration based on additional months
      let newExpiry: Date;
      if (additionalMonths >= 12) {
        // 12+ additional months = 1 year extension
        newExpiry = new Date();
        newExpiry.setFullYear(newExpiry.getFullYear() + 1);
        statusResponse.extension_available = {
          type: 'year',
          months: additionalMonths,
          new_expires_at: newExpiry.toISOString()
        };
      } else {
        // Proportional extension
        newExpiry = new Date();
        newExpiry.setMonth(newExpiry.getMonth() + additionalMonths);
        statusResponse.extension_available = {
          type: 'proportional',
          months: additionalMonths,
          new_expires_at: newExpiry.toISOString()
        };
      }
    }

    // Update last checked timestamp
    await BetaUser.updateOne(
      { _id: user._id, 'linkedDevices.hardwareId': hardwareId },
      {
        $set: {
          'linkedDevices.$.lastChecked': new Date(),
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json(statusResponse);

  } catch (error) {
    console.error('Referral status check error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
