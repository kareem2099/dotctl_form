import mongoose from 'mongoose';

export interface IAdminUser {
  username: string;
  email: string;
  password: string; // hashed
  role: 'super_admin' | 'admin' | 'moderator';
  isActive: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string; // TOTP secret
  backupCodes?: string[]; // Recovery codes
  lastLogin?: Date;
  loginAttempts: number;
  lockoutUntil?: Date;
  apiKeys: {
    key: string;
    name: string;
    lastUsed?: Date;
    expiresAt?: Date;
    permissions: string[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new mongoose.Schema<IAdminUser>({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [12, 'Password must be at least 12 characters']
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    trim: true
  },
  backupCodes: [{
    type: String,
    trim: true
  }],
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockoutUntil: {
    type: Date
  },
  apiKeys: [{
    key: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    lastUsed: Date,
    expiresAt: Date,
    permissions: [{
      type: String,
      enum: ['read', 'write', 'delete', 'admin'],
      default: ['read']
    }]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
// AdminUserSchema.index({ username: 1 });
// AdminUserSchema.index({ email: 1 });
AdminUserSchema.index({ role: 1 });
AdminUserSchema.index({ isActive: 1 });
// AdminUserSchema.index({ 'apiKeys.key': 1 });

// Update updatedAt on save
AdminUserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Check if the model already exists to avoid recompile errors
export default mongoose.models.AdminUser ?? mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
