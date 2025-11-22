import mongoose, { Model, Document } from 'mongoose';

export interface ISettings {
  // Security Settings
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
    enforcePasswordHistory: number;
    lockoutDuration: number;
    enableBruteForceProtection: boolean;
    ipWhitelist?: string[];
    ipBlacklist?: string[];
  };

  // Email Settings
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    smtpSecure: boolean;
    fromEmail: string;
    fromName: string;
    enableNotifications: boolean;
    adminNotificationEmail: string;
  };

  // Notification Settings
  notifications: {
    emailOnNewSignup: boolean;
    emailOnSystemError: boolean;
    emailDigest: boolean;
    emailDigestFrequency: 'daily' | 'weekly' | 'monthly';
    slackWebhookUrl?: string;
    discordWebhookUrl?: string;
  };

  // Database Settings
  database: {
    maxPoolSize: number;
    minPoolSize: number;
    serverSelectionTimeout: number;
    socketTimeout: number;
    maxIdleTime: number;
    enableProfiling: boolean;
    logSlowQueries: boolean;
    slowQueryThreshold: number;
  };

  // System Maintenance
  maintenance: {
    enableMaintenanceMode: boolean;
    maintenanceMessage?: string;
    enableBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    backupRetention: number;
    enableLogsRotation: boolean;
    logRetention: number;
    enableMetricsCollection: boolean;
  };

  // Beta Program Settings
  beta: {
    maxPositions: number;
    waitingListEnabled: boolean;
    autoApprovalEnabled: boolean;
    defaultSkillLevel: 'beginner' | 'intermediate' | 'advanced';
    requirePhone: boolean;
    enablePositionPriority: boolean;
  };

  // Advanced Settings
  advanced: {
    enableApiRateLimit: boolean;
    apiRateLimitPerMinute: number;
    enableCors: boolean;
    corsOrigins?: string[];
    enableCompression: boolean;
    cacheEnabled: boolean;
    cacheTtl: number;
    enableHealthChecks: boolean;
  };

  updatedBy: string;
  updatedAt: Date;
}

// Extend Document to include instance methods if needed
export interface ISettingsDocument extends ISettings, Document {}

// Define the model interface with static methods
interface ISettingsModel extends Model<ISettingsDocument> {
  getSingleton(): Promise<ISettingsDocument>;
}

const SettingsSchema = new mongoose.Schema<ISettingsDocument, ISettingsModel>({
  security: {
    sessionTimeout: { type: Number, default: 60, min: 5, max: 1440 },
    maxLoginAttempts: { type: Number, default: 5, min: 1, max: 20 },
    passwordMinLength: { type: Number, default: 12, min: 8, max: 128 },
    requireTwoFactor: { type: Boolean, default: false },
    enforcePasswordHistory: { type: Number, default: 3, min: 0, max: 10 },
    lockoutDuration: { type: Number, default: 30, min: 5, max: 1440 },
    enableBruteForceProtection: { type: Boolean, default: true },
    ipWhitelist: [{ type: String }],
    ipBlacklist: [{ type: String }]
  },

  email: {
    smtpHost: { type: String, default: '', trim: true },
    smtpPort: { type: Number, default: 587, min: 1, max: 65535 },
    smtpUser: { type: String, default: '', trim: true },
    smtpPassword: { type: String, default: '', trim: true },
    smtpSecure: { type: Boolean, default: false },
    fromEmail: { type: String, default: '', trim: true, lowercase: true },
    fromName: { type: String, default: '', trim: true },
    enableNotifications: { type: Boolean, default: true },
    adminNotificationEmail: { type: String, default: '', trim: true, lowercase: true }
  },

  notifications: {
    emailOnNewSignup: { type: Boolean, default: true },
    emailOnSystemError: { type: Boolean, default: true },
    emailDigest: { type: Boolean, default: true },
    emailDigestFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    slackWebhookUrl: { type: String, trim: true },
    discordWebhookUrl: { type: String, trim: true }
  },

  database: {
    maxPoolSize: { type: Number, default: 10, min: 1, max: 100 },
    minPoolSize: { type: Number, default: 2, min: 0, max: 50 },
    serverSelectionTimeout: { type: Number, default: 5000, min: 1000, max: 60000 },
    socketTimeout: { type: Number, default: 45000, min: 5000, max: 120000 },
    maxIdleTime: { type: Number, default: 30000, min: 0, max: 600000 },
    enableProfiling: { type: Boolean, default: false },
    logSlowQueries: { type: Boolean, default: false },
    slowQueryThreshold: { type: Number, default: 100, min: 1, max: 60000 }
  },

  maintenance: {
    enableMaintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, trim: true },
    enableBackup: { type: Boolean, default: false },
    backupFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
    backupRetention: { type: Number, default: 30, min: 1, max: 365 },
    enableLogsRotation: { type: Boolean, default: true },
    logRetention: { type: Number, default: 7, min: 1, max: 365 },
    enableMetricsCollection: { type: Boolean, default: true }
  },

  beta: {
    maxPositions: { type: Number, default: 1000, min: 1, max: 10000 },
    waitingListEnabled: { type: Boolean, default: true },
    autoApprovalEnabled: { type: Boolean, default: false },
    defaultSkillLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    requirePhone: { type: Boolean, default: true },
    enablePositionPriority: { type: Boolean, default: true }
  },

  advanced: {
    enableApiRateLimit: { type: Boolean, default: true },
    apiRateLimitPerMinute: { type: Number, default: 100, min: 10, max: 10000 },
    enableCors: { type: Boolean, default: true },
    corsOrigins: [{ type: String }],
    enableCompression: { type: Boolean, default: true },
    cacheEnabled: { type: Boolean, default: false },
    cacheTtl: { type: Number, default: 3600, min: 60, max: 86400 },
    enableHealthChecks: { type: Boolean, default: true }
  },

  updatedBy: {
    type: String,
    required: true,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
SettingsSchema.index({ updatedAt: -1 });

// Update updatedAt on save
SettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Validate email settings
SettingsSchema.pre('save', function(next) {
  if (this.email.enableNotifications && (!this.email.smtpHost || !this.email.fromEmail)) {
    next(new Error('SMTP host and from email are required when notifications are enabled'));
  } else {
    next();
  }
});

// Ensure there's always exactly one settings document
SettingsSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existing = await mongoose.models.Settings?.countDocuments();
    if (existing > 0) {
      next(new Error('Only one settings document is allowed'));
    } else {
      next();
    }
  } else {
    next();
  }
});

// Static method to get the single settings document
SettingsSchema.statics.getSingleton = async function(this: ISettingsModel) {
  let settings = await this.findOne();
  if (!settings) {
    // Create default settings if none exist
    settings = new this({
      updatedBy: 'system'
    });
    await settings.save();
  }
  return settings;
};

// Export with proper typing
const Settings = (mongoose.models.Settings as ISettingsModel) || 
  mongoose.model<ISettingsDocument, ISettingsModel>('Settings', SettingsSchema);

export default Settings;