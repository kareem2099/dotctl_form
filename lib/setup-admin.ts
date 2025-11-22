// Load environment variables from .env file FIRST
import * as dotenv from 'dotenv';
dotenv.config();

import AdminUser from '../models/AdminUser';
import { hashPassword, generateBackupCodes } from './auth';
import dbConnect from './mongodb';

export interface SetupAdminOptions {
  username: string;
  email: string;
  password: string;
  role?: 'super_admin' | 'admin' | 'moderator';
}

/**
 * Create the first admin user for the system
 * This should only be run once during initial setup
 */
export const createFirstAdmin = async (options: SetupAdminOptions): Promise<{ success: boolean; message: string; admin?: { id: string; username: string; email: string; role: string } }> => {
  try {
    // Connect to database
    await dbConnect();

    // Check if any admin users already exist
    const existingAdmins = await AdminUser.find({ isActive: true });
    if (existingAdmins.length > 0) {
      return { success: false, message: 'Admin users already exist in the system. Setup can only run when no admins exist.' };
    }

    // Hash the password
    const hashedPassword = await hashPassword(options.password);

    // Generate backup codes for 2FA (optional)
    const backupCodes = generateBackupCodes();

    // Create the super admin user
    const superAdmin = new AdminUser({
      username: options.username.trim().toLowerCase(),
      email: options.email.trim().toLowerCase(),
      password: hashedPassword,
      role: options.role || 'super_admin',
      isActive: true,
      twoFactorEnabled: false, // Will be enabled after first login
      backupCodes: backupCodes,
    });

    await superAdmin.save();

    console.log('✅ First admin user created successfully!');
    console.log(`📧 Email: ${options.email}`);
    console.log(`👤 Username: ${options.username}`);
    console.log(`🔐 Role: ${options.role || 'super_admin'}`);
    console.log('🎫 Backup Codes (save these securely):', backupCodes);
    console.log('\n🚨 IMPORTANT: Change the password and enable 2FA immediately after first login!');
    console.log('📱 You can access the admin dashboard at: /admin/login');

    return {
      success: true,
      message: 'First admin user created successfully. Check console for details.',
      admin: {
        id: superAdmin._id,
        username: superAdmin.username,
        email: superAdmin.email,
        role: superAdmin.role
      }
    };

  } catch (error) {
    console.error('❌ Failed to create first admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Failed to create admin user: ${errorMessage}`
    };
  }
};

/**
 * Setup script for easy admin initialization
 * Run this from a Node.js script or API endpoint
 */
export const setupAdminSystem = async () => {
  // Default admin credentials - CHANGE THESE IN PRODUCTION!
  const defaultAdmin = {
    username: process.env.ADMIN_USERNAME || 'admin',
    email: process.env.ADMIN_EMAIL || 'admin@dotctl.local',
    password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
    role: 'super_admin' as const
  };

  console.log('🏗️  Setting up DotCTL Admin System...\n');

  // Validate environment variables
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI environment variable is not set!');
    return false;
  }

  const result = await createFirstAdmin(defaultAdmin);

  if (result.success) {
    console.log('✅ Admin setup completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Start the application: npm run dev');
    console.log('2. Go to /admin/login');
    console.log('3. Login with your admin credentials');
    console.log('4. Immediately change the default password');
    console.log('5. Enable two-factor authentication');
    console.log('6. Save the backup codes securely');

    return true;
  } else {
    console.error('❌ Admin setup failed:', result.message);
    return false;
  }
};

// CLI runner for setup (can be used with: node -e "require('./lib/setup-admin.js').setupAdminSystem()")
if (require.main === module) {
  setupAdminSystem()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
