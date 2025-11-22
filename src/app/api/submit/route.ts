import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import BetaUser from '../../../../models/BetaUser';
import { sendWelcomeEmail, sendReferralNotificationEmail, sendMilestoneAchievementEmail } from '../../../../lib/email';
import { sanitizeTextInput, isValidEmail, isValidPhone, isValidName, isValidUseCase } from '../../../../lib/sanitize';
import { apiRateLimit } from '../../../../lib/rate-limit';

// Milestone definitions and rewards
const MILESTONES = {
  early_influencer: { threshold: 5, bonusMonths: 2, displayName: 'Early Influencer' },
  community_builder: { threshold: 10, bonusMonths: 3, displayName: 'Community Builder' },
  referral_champion: { threshold: 25, bonusMonths: 5, displayName: 'Referral Champion' },
  viral_force: { threshold: 50, bonusMonths: 10, displayName: 'Viral Force' },
  super_spreader: { threshold: 100, bonusMonths: 20, displayName: 'Super Spreader' },
};

// Check for milestone achievements
function checkMilestones(currentReferrals: number) {
  const achieved: string[] = [];

  Object.entries(MILESTONES).forEach(([key, milestone]) => {
    if (currentReferrals === milestone.threshold) {
      achieved.push(key);
    }
  });

  return achieved;
}

// Generate unique referral code
function generateReferralCode(): string {
  let code: string;
  do {
    // Generate code starting with DOTCTL followed by 6 random alphanumeric characters
    const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
    code = `DOTCTL${randomPart}`;
  } while (code.length !== 12); // DOTCTL (6) + 6 random = 12 total
  return code;
}

export const POST = apiRateLimit(async (request: Request) => {
  try {
    // Connect to database
    await dbConnect();

    // Get form data including referralCode
    const { name, email, phone, useCase, skillLevel, featureInterests, referralSource, wantsUpdates, referralCode } = await request.json();

    // Sanitize inputs first
    const sanitizedName = sanitizeTextInput(name);
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedPhone = sanitizeTextInput(phone);
    const sanitizedUseCase = sanitizeTextInput(useCase);

    // Basic validation
    if (!sanitizedName || !sanitizedEmail || !sanitizedPhone || !sanitizedUseCase || !skillLevel || !Array.isArray(featureInterests) || featureInterests.length === 0) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate phone
    if (!isValidPhone(sanitizedPhone)) {
      return NextResponse.json(
        { error: 'Phone number must be valid (10-15 digits)' },
        { status: 400 }
      );
    }

    // Validate name
    if (!isValidName(sanitizedName)) {
      return NextResponse.json(
        { error: 'Name contains invalid characters' },
        { status: 400 }
      );
    }

    // Validate use case
    if (!isValidUseCase(sanitizedUseCase)) {
      return NextResponse.json(
        { error: 'Use case contains invalid content or spam patterns' },
        { status: 400 }
      );
    }

    // Get user position (next in line)
    const userCount = await BetaUser.countDocuments();
    const position = userCount + 1;

    // Generate early access code
    const earlyAccessCode = `BETA-DOTCTL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Generate unique referral code for this user
    let userReferralCode: string;
    let attempts = 0;
    do {
      userReferralCode = generateReferralCode();
      attempts++;
      if (attempts > 100) {
        return NextResponse.json(
          { error: 'Unable to generate unique referral code. Please try again.' },
          { status: 500 }
        );
      }
    } while (await BetaUser.findOne({ referralCode: userReferralCode }));

    let referrerEmail: string | undefined;

    // Validate and process referral code if provided
    if (referralCode && referralCode.trim()) {
      const trimmedCode = referralCode.trim().toUpperCase();

      // Check if referral code exists
      const referrer = await BetaUser.findOne({ referralCode: trimmedCode });
      if (!referrer) {
        return NextResponse.json(
          { error: 'Invalid referral code' },
          { status: 400 }
        );
      }

      // Prevent self-referral
      if (referrer.email.toLowerCase() === email.toLowerCase()) {
        return NextResponse.json(
          { error: 'You cannot refer yourself' },
          { status: 400 }
        );
      }

      referrerEmail = referrer.email;
    }

    // Create new beta user
    const betaUser = new BetaUser({
      name: sanitizedName,
      email: sanitizedEmail,
      phone: sanitizedPhone,
      useCase: sanitizedUseCase,
      skillLevel: skillLevel.toLowerCase(),
      featureInterests: featureInterests.map((f: string) => f.toLowerCase()),
      referralSource: referralSource?.toLowerCase() || 'other',
      wantsUpdates: wantsUpdates || true,
      position: position,
      earlyAccessCode: earlyAccessCode,
      referralCode: userReferralCode,
      referredBy: referrerEmail,
      referralCount: 0,
      rewardMonths: referrerEmail ? 0 : 0, // New user starts with 0 rewards
    });

    // Save new user to database
    await betaUser.save();

    // Update referrer stats if valid referral and handle milestones
    if (referrerEmail) {
      // Get current referrer data to check for milestones
      const referrer = await BetaUser.findOne({ email: referrerEmail });
      if (referrer) {
        const newReferralCount = referrer.referralCount + 1;

        // Check for milestones achieved with this new referral
        const achievedMilestones = checkMilestones(newReferralCount);
        let bonusMonthsGranted = 0;

        // Calculate bonus months from milestones
        const milestoneUpdates = [];
        for (const milestone of achievedMilestones) {
          const milestoneData = MILESTONES[milestone as keyof typeof MILESTONES];
          if (milestoneData) {
            milestoneUpdates.push({
              milestone,
              achievedAt: new Date(),
              bonusMonthsGranted: milestoneData.bonusMonths
            });
            bonusMonthsGranted += milestoneData.bonusMonths;
          }
        }

        // Update referrer with new referral count, regular + bonus months, and milestones
        await BetaUser.updateOne(
          { email: referrerEmail },
          {
            $inc: {
              referralCount: 1,
              rewardMonths: 1 + bonusMonthsGranted // Regular 1 + bonus months
            },
            $push: { milestonesReached: { $each: milestoneUpdates } },
            $set: { updatedAt: new Date() }
          }
        );

        // Send notifications for referral and milestone achievements
        try {
          const shareLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}?ref=${referrer.referralCode}`;

          // Send referral notification email
          await sendReferralNotificationEmail(
            referrerEmail,
            referrer.name,
            name.trim(), // referred user name
            1 + bonusMonthsGranted, // total bonus this time (regular + milestone bonus)
            newReferralCount,
            referrer.rewardMonths + 1 + bonusMonthsGranted, // updated total reward months
            shareLink
          );

          // Send milestone achievement emails for each unlocked milestone
          for (const milestoneData of milestoneUpdates) {
            const milestoneDetails = MILESTONES[milestoneData.milestone as keyof typeof MILESTONES];
            if (milestoneDetails) {
              await sendMilestoneAchievementEmail(
                referrerEmail,
                referrer.name,
                milestoneDetails.displayName,
                milestoneData.bonusMonthsGranted,
                newReferralCount,
                referrer.rewardMonths + 1 + bonusMonthsGranted, // updated total
                shareLink
              );
            }
          }

          console.log(`✅ Notifications sent to ${referrerEmail} for referral by ${name.trim()}`);
        } catch (notificationError) {
          console.warn('Notification sending failed, but referral processing succeeded:', notificationError);
          // Don't fail the registration if notifications fail
        }
      }
    }

    // Send welcome email (don't block on email failure)
    try {
      const shareLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}?ref=${userReferralCode}`;
      await sendWelcomeEmail(email, name.trim(), position, earlyAccessCode, userReferralCode, shareLink);
    } catch (emailError) {
      console.warn('Email sending failed, but user registration succeeded:', emailError);
      // Don't fail the registration if email fails
    }

    return NextResponse.json(
      {
        message: 'Successfully joined the beta list!',
        position: position,
        earlyAccessCode: earlyAccessCode,
        skillLevel: betaUser.skillLevel,
        featureInterests: betaUser.featureInterests,
        wantsUpdates: betaUser.wantsUpdates,
        referralCode: userReferralCode,
        referredBy: referrerEmail || null,
        rewardInfo: {
          currentRewards: 0, // New users start with 0
          conversionRule: 'Earn 1 reward month per referral. 12 reward months = 1 year free pro.'
        }
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error('Database error:', error);

    // Handle duplicate email
    if (typeof error === 'object' && error !== null && 'code' in error && (error as {code: number}).code === 11000) {
      return NextResponse.json(
        { error: 'This email is already registered for beta access' },
        { status: 409 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
});
