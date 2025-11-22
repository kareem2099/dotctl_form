import mongoose from 'mongoose';

export interface IMilestoneReached {
  milestone: string;
  achievedAt: Date;
  bonusMonthsGranted: number;
}

export interface IDeviceLink {
  userEmail: string;
  hardwareId: string;
  linkedAt: Date;
  lastChecked: Date;
  referralSnapshot: {
    monthsUsedForLicense: number;
    remainingRewardMonths: number;
    lastLicenseKey?: string;
  };
}

export interface IBetaUser {
  name: string;
  email: string;
  phone: string;
  useCase: string;
  skillLevel: string;
  featureInterests: string[];
  referralSource: string;
  wantsUpdates: boolean;
  position: number;
  submittedAt: Date;
  referralCode: string; // Unique code for sharing invitations
  referredBy?: string; // Email of the referrer
  referralCount: number; // Number of successful referrals made
  rewardMonths: number; // Total reward months earned from referrals
  milestonesReached: IMilestoneReached[]; // Achievement milestones unlocked
  linkedDevices?: IDeviceLink[]; // DOTCTL Python devices linked via referral system
  tempOTP?: string; // Temporary OTP for device linking (not persisted long-term)
  otpExpiry?: Date; // OTP expiration timestamp (not persisted long-term)
}

const BetaUserSchema = new mongoose.Schema<IBetaUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  useCase: {
    type: String,
    required: [true, 'How will you use DotCTL? is required'],
    trim: true,
  },
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  featureInterests: [{
    type: String,
    enum: ['arp_spoofing', 'bandwidth_limiting', 'traffic_monitoring', 'dns_spoofing', 'content_injection', 'session_hijacking', 'deep_packet_inspection', 'stealth_features', 'ml_traffic_analysis'],
    required: true,
  }],
  referralSource: {
    type: String,
    enum: ['github', 'stackoverflow', 'twitter', 'linkedin', 'reddit', 'hacker_news', 'search', 'friend', 'article', 'other'],
    default: 'other',
  },
  wantsUpdates: {
    type: Boolean,
    default: true,
  },
  position: {
    type: Number,
    default: 0,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  referralCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  referredBy: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid referrer email'],
  },
  referralCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  rewardMonths: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Milestone tracking for gamification
  milestonesReached: [{
    milestone: { type: String, required: true }, // 'early_influencer', 'community_builder', etc.
    achievedAt: { type: Date, default: Date.now },
    bonusMonthsGranted: { type: Number, required: true },
  }],

  // DOTCTL device linking for referral-based licenses
  linkedDevices: [{
    hardwareId: { type: String, required: true, unique: true },
    linkedAt: { type: Date, default: Date.now },
    lastChecked: { type: Date, default: Date.now },
    referralSnapshot: {
      monthsUsedForLicense: { type: Number, default: 0 },
      remainingRewardMonths: { type: Number, default: 0 },
      lastLicenseKey: { type: String, required: false }
    }
  }],

  // Temporary OTP fields for device linking (not part of the main schema, cleared after use)
  tempOTP: {
    type: String,
    required: false,
    select: false // Don't include in regular queries for security
  },
  otpExpiry: {
    type: Date,
    required: false,
    select: false // Don't include in regular queries for security
  }
});

// Indexes for performance
BetaUserSchema.index({ referralCode: 1 });
BetaUserSchema.index({ referredBy: 1 });
BetaUserSchema.index({ 'linkedDevices.hardwareId': 1 });

// Prevent referral loops - user cannot refer themselves
BetaUserSchema.pre('save', async function(next) {
  if (this.referredBy && this.referredBy === this.email) {
    next(new Error('Cannot refer yourself'));
  }
  next();
});

// Check if the model already exists to avoid recompile errors
export default mongoose.models.BetaUser ?? mongoose.model<IBetaUser>('BetaUser', BetaUserSchema);
