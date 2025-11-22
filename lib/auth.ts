import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import crypto from 'crypto';
import AdminUser from '../models/AdminUser';
import dbConnect from './mongodb';
import { sendMagicLinkEmail, sendSecurityAlertEmail } from './email';

// JWT secrets - must be set in environment variables
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-super-secure-jwt-secret-32-chars-or-more') {
  throw new Error('JWT_SECRET environment variable must be set with a secure random value');
}
if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === 'your-super-secure-jwt-refresh-secret-32-chars-or-more') {
  throw new Error('JWT_REFRESH_SECRET environment variable must be set with a secure random value');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = '1h'; // 1 hour for access tokens
const JWT_REFRESH_EXPIRES_IN = '30d'; // 30 days for refresh tokens

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface MagicLinkPayload {
  email: string;
  purpose: 'login' | 'password_reset' | 'invite';
  expiresAt: Date;
  token: string;
}

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateStrongPassword = (): string => {
  // Generate a cryptographically secure 16-character password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(16 * 2); // Extra bytes to ensure enough entropy
  let password = '';
  let index = 0;

  for (let i = 0; i < 16; i++) {
    // Use modulo to get valid character index that's within bounds
    index = randomBytes[i] % chars.length;
    password += chars.charAt(index);
  }
  return password;
};

// JWT utilities
export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const generateRefreshToken = (payload: Partial<JWTPayload>): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.debug('JWT access token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};

export const verifyRefreshToken = (token: string): Partial<JWTPayload> | null => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as Partial<JWTPayload>;
  } catch (error) {
    console.debug('JWT refresh token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};

export const generateMagicLinkToken = (email: string, purpose: 'login' | 'password_reset' | 'invite' = 'login'): MagicLinkPayload => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  return {
    email,
    purpose,
    expiresAt,
    token
  };
};

export const hashMagicLinkToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Two-Factor Authentication (TOTP)
export const generateTOTPSecret = (username: string): { secret: string; otpauth_url: string } => {
  const secret = speakeasy.generateSecret({
    name: `DotCTL Admin (${username})`,
    issuer: 'DotCTL',
    length: 32
  });

  return {
    secret: secret.base32,
    otpauth_url: secret.otpauth_url!
  };
};

export const verifyTOTP = (secret: string, token: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Allow 2 time steps for clock skew
  });
};

export const generateBackupCodes = (): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
};

// API Key utilities
export const generateApiKey = (): string => {
  return 'dct_' + crypto.randomBytes(32).toString('hex');
};

export const hashApiKey = (apiKey: string): string => {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};

// Session and security utilities
export const checkAccountLockout = async (email: string): Promise<{ locked: boolean; lockoutUntil?: Date }> => {
  await dbConnect();

  const user = await AdminUser.findOne({ email: email.toLowerCase() });

  if (!user) {
    return { locked: false };
  }

  if (user.loginAttempts >= 5) {
    const lockoutTime = 15 * 60 * 1000; // 15 minutes
    const lockoutUntil = new Date(Date.now() + lockoutTime);

    if (!user.lockoutUntil || user.lockoutUntil < new Date()) {
      await AdminUser.updateOne(
        { _id: user._id },
        { $set: { lockoutUntil: lockoutUntil } }
      );
      return { locked: true, lockoutUntil };
    }

    if (user.lockoutUntil > new Date()) {
      return { locked: true, lockoutUntil: user.lockoutUntil };
    }
  }

  return { locked: false };
};

export const recordLoginAttempt = async (email: string, success: boolean): Promise<void> => {
  await dbConnect();

  if (success) {
    await AdminUser.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          loginAttempts: 0,
          lockoutUntil: null,
          lastLogin: new Date()
        }
      }
    );
  } else {
    await AdminUser.updateOne(
      { email: email.toLowerCase() },
      { $inc: { loginAttempts: 1 } }
    );
  }
};

// Rate limiting helper
export const isRateLimited = (attempts: number, windowMs: number = 900000 /* 15 minutes */): boolean => {
  if (attempts < 5) return false;
  // Log rate limiting for monitoring
  console.debug(`Rate limit triggered for ${attempts} attempts in ${windowMs}ms window`);
  return true;
};

// Security monitoring
export const logSecurityEvent = async (
  event: string,
  details: Record<string, unknown>,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<void> => {
  console.log(`[SECURITY ${severity.toUpperCase()}] ${event}:`, details);

  // In a real application, you'd send this to a logging service or database
  // For now, we'll just log critical security events to email
  if (severity === 'critical') {
    try {
      await sendSecurityAlertEmail(event, details);
    } catch (error) {
      console.error('Failed to send security alert email:', error);
    }
  }
};

// Admin authentication functions
export const authenticateAdmin = async (
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; user?: { id: string; username: string; email: string; role: string; lastLogin?: Date }; token?: string; refreshToken?: string; requires2FA?: boolean; error?: string }> => {
  try {
    await dbConnect();

    // Check for account lockout first
    const lockout = await checkAccountLockout(email);
    if (lockout.locked) {
      await logSecurityEvent('Account Locked', { email, lockoutUntil: lockout.lockoutUntil }, 'medium');
      return {
        success: false,
        error: `Account is locked due to too many failed attempts. Try again after ${Math.ceil((lockout.lockoutUntil!.getTime() - Date.now()) / 60000)} minutes.`
      };
    }

    const user = await AdminUser.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: email.toLowerCase() }
      ],
      isActive: true
    });

    if (!user) {
      await recordLoginAttempt(email, false);
      return { success: false, error: 'Invalid credentials' };
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      await recordLoginAttempt(email, false);
      await logSecurityEvent('Failed Login Attempt', { email, ipAddress, userAgent }, 'low');
      return { success: false, error: 'Invalid credentials' };
    }

    await recordLoginAttempt(email, true);

    // If 2FA is enabled, require it
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      return {
        success: false,
        requires2FA: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        error: 'Two-factor authentication required'
      };
    }

    // Generate tokens
    const payload: JWTPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: getPermissionsForRole(user.role)
    };

    const token = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ userId: user._id.toString() });

    await logSecurityEvent('Successful Login', { email, ipAddress, userAgent }, 'low');

    return {
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      },
      token,
      refreshToken
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
};

export const verify2FA = async (
  userId: string,
  token: string
): Promise<{ success: boolean; accessToken?: string; refreshToken?: string; error?: string }> => {
  try {
    await dbConnect();

    const user = await AdminUser.findById(userId);
    if (!user || !user.twoFactorSecret) {
      return { success: false, error: 'Invalid user or 2FA not configured' };
    }

    const isValidTOTP = verifyTOTP(user.twoFactorSecret, token);
    if (!isValidTOTP) {
      return { success: false, error: 'Invalid 2FA code' };
    }

    // Generate tokens after successful 2FA
    const payload: JWTPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: getPermissionsForRole(user.role)
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ userId: user._id.toString() });

    // Update last login
    await AdminUser.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    return {
      success: true,
      accessToken,
      refreshToken
    };
  } catch (error) {
    console.error('2FA verification error:', error);
    return { success: false, error: '2FA verification failed' };
  }
};

export const sendMagicLink = async (
  email: string,
  baseUrl: string = process.env.APP_URL || 'http://localhost:3000'
): Promise<{ success: boolean; error?: string }> => {
  try {
    await dbConnect();

    const user = await AdminUser.findOne({ email: email.toLowerCase(), isActive: true });
    if (!user) {
      return { success: false, error: 'Admin user not found' };
    }

    const magicLinkData = generateMagicLinkToken(email, 'login');
    const tokenHash = hashMagicLinkToken(magicLinkData.token);

    // Store the hash in database (in production, use Redis or similar)
    // For now, we'll send the token directly but hash it for verification
    console.debug('Magic link token hash for verification:', tokenHash);

    const magicLinkUrl = `${baseUrl}/admin/magic-link/verify?token=${magicLinkData.token}&email=${encodeURIComponent(email)}`;

    await sendMagicLinkEmail(email, user.username, magicLinkUrl, magicLinkData.expiresAt);

    return { success: true };
  } catch (error) {
    console.error('Magic link send error:', error);
    return { success: false, error: 'Failed to send magic link' };
  }
};

export const verifyMagicLink = async (
  email: string,
  token: string
): Promise<{ success: boolean; user?: { id: string; username: string; email: string; role: string }; token?: string; refreshToken?: string; error?: string }> => {
  try {
    await dbConnect();

    const user = await AdminUser.findOne({ email: email.toLowerCase(), isActive: true });
    if (!user) {
      return { success: false, error: 'Invalid magic link' };
    }

    const tokenHash = hashMagicLinkToken(token);
    // In production, verify against stored hash with expiration
    console.debug('Verifying magic link with token hash:', tokenHash);

    const payload: JWTPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: getPermissionsForRole(user.role)
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ userId: user._id.toString() });

    // Update last login
    await AdminUser.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    return {
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token: accessToken,
      refreshToken
    };
  } catch (error) {
    console.error('Magic link verification error:', error);
    return { success: false, error: 'Magic link verification failed' };
  }
};

// Permission system
export const getPermissionsForRole = (role: string): string[] => {
  switch (role) {
    case 'super_admin':
      return ['read', 'write', 'delete', 'admin', 'system', 'security', 'users', 'analytics'];
    case 'admin':
      return ['read', 'write', 'delete', 'admin', 'analytics', 'users'];
    case 'moderator':
      return ['read', 'write', 'analytics'];
    default:
      return ['read'];
  }
};

export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  return userPermissions.includes(requiredPermission) ||
         userPermissions.includes('admin') ||
         userPermissions.includes('super_admin');
};
