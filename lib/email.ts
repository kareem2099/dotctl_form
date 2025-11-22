import nodemailer from 'nodemailer';

// Create transporter using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Verify transporter connection
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email server connection established');
    return true;
  } catch (error) {
    console.error('Email server connection failed:', error);
    return false;
  }
};

// Email templates
const getWelcomeEmailTemplate = (userName: string, position: number, earlyAccessCode: string, referralCode?: string, shareLink?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to DotCTL Beta!</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .welcome-message { font-size: 18px; margin-bottom: 30px; }
    .beta-info { background: #f8fafc; padding: 20px; border-radius: 6px; margin: 30px 0; border-left: 4px solid #667eea; }
    .footer { background: #1a1a1a; padding: 30px; text-align: center; }
    .footer p { color: #9ca3af; margin: 0; font-size: 14px; }
    .code { font-family: 'Courier New', monospace; background: #f3f4f6; padding: 12px 24px; border-radius: 6px; display: inline-block; margin: 20px 0; font-size: 16px; font-weight: bold; color: #1e40af; }
    .position { background: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to DotCTL Beta!</h1>
    </div>

    <div class="content">
      <p class="welcome-message">Hi ${userName},</p>

      <p>Welcome to the DotCTL Beta Program! We're excited to have you join our community of cybersecurity enthusiasts and network professionals interested in advanced traffic control and analysis.</p>

      <div class="beta-info">
        <h3>📝 Your Beta Details</h3>
        <div class="position">
          <strong>Waitlist Position: #${position}</strong>
          <br>
          <small>Your early access code:</small>
          <div class="code">${earlyAccessCode}</div>
        </div>
      </div>

      <h3>🚀 What Happens Next?</h3>
      <ul>
        <li><strong>Exclusive Access:</strong> You'll receive priority access to new DotCTL releases</li>
        <li><strong>Direct Feedback:</strong> Help shape DotCTL's future development</li>
        <li><strong>Community:</strong> Connect with other beta testers and network enthusiasts</li>
        <li><strong>Advanced Features:</strong> Get first access to our most powerful tools</li>
      </ul>

      <p>We appreciate your interest in DotCTL and can't wait to see how you'll use our advanced network analysis capabilities!</p>

      ${referralCode && shareLink ? `
      <div class="beta-info">
        <h3>🎁 Referral Program</h3>
        <p>Help us grow our community and earn <strong>FREE pro access</strong> for every friend you refer!</p>
        <div class="position">
          <strong>Your Referral Code: ${referralCode}</strong>
          <br>
          <small>Share this link:</small>
          <div class="code" style="word-break: break-all; font-size: 12px;">${shareLink}</div>
        </div>
        <p>For each friend who signs up using your code, you'll earn 1 month of free pro access. When you reach 12 months, it automatically converts to 1 full year!</p>
      </div>
      ` : ''}

      <p>Best regards,<br>The DotCTL Team</p>
    </div>

    <div class="footer">
      <p>&copy; 2025 DotCTL - Dynamic Overhead Traffic Control<br>
      This email was sent to confirm your beta access registration.</p>
    </div>
  </div>
</body>
</html>
`;

const getThanksEmailTemplate = (userName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Thank You for Joining DotCTL Beta!</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: #10b981; padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .thanks-message { font-size: 18px; margin-bottom: 30px; }
    .footer { background: #1a1a1a; padding: 30px; text-align: center; }
    .footer p { color: #9ca3af; margin: 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🙌 Registration Confirmed!</h1>
    </div>

    <div class="content">
      <p class="thanks-message">Hi ${userName},</p>

      <p>Thank you for joining the DotCTL Beta Program! We've successfully received your registration and you're now on our waitlist.</p>

      <p>Your interest in our advanced network traffic control tools means a lot to us. As a beta participant, you'll play a crucial role in helping us build the most powerful network analysis solution.</p>

      <p>We'll be in touch soon with updates about beta access, new features, and development progress.</p>

      <p>Stay tuned!</p>

      <p>Best regards,<br>The DotCTL Team</p>
    </div>

    <div class="footer">
      <p>&copy; 2025 DotCTL - Dynamic Overhead Traffic Control<br>
      This is a confirmation email for your beta registration.</p>
    </div>
  </div>
</body>
</html>
`;

// Send welcome email to new beta user
export const sendWelcomeEmail = async (
  email: string,
  name: string,
  position: number,
  earlyAccessCode: string,
  referralCode?: string,
  shareLink?: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"DotCTL Beta" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: '🎉 Welcome to DotCTL Beta Program!',
      html: getWelcomeEmailTemplate(name, position, earlyAccessCode, referralCode, shareLink),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email to', email, ':', error);
    return false;
  }
};

// Send thanks email (simpler)
export const sendThanksEmail = async (
  email: string,
  name: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"DotCTL Beta" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: '🙌 Thank You for Joining DotCTL Beta!',
      html: getThanksEmailTemplate(name),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Thanks email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send thanks email to', email, ':', error);
    return false;
  }
};

// Magic link email template
const getMagicLinkEmailTemplate = (username: string, magicLinkUrl: string, expiresAt: Date) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DotCTL Admin Login Link</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .warning { background: #fef3c7; padding: 20px; border-radius: 6px; margin: 30px 0; border-left: 4px solid #f59e0b; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .link { word-break: break-all; background: #f3f4f6; padding: 15px; border-radius: 6px; font-family: monospace; margin: 20px 0; }
    .footer { background: #1a1a1a; padding: 30px; text-align: center; }
    .footer p { color: #9ca3af; margin: 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 DotCTL Admin Login</h1>
    </div>

    <div class="content">
      <p>Hello ${username},</p>

      <p>You've requested admin access to the DotCTL beta dashboard. Click the button below to securely log in:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${magicLinkUrl}" class="button">🔑 Secure Login</a>
      </div>

      <div class="warning">
        <strong>⚠️ Security Notice:</strong>
        <ul>
          <li>This link expires on ${expiresAt.toLocaleString()}</li>
          <li>Can only be used once</li>
          <li>Do not share this email with anyone</li>
        </ul>
      </div>

      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <div class="link">${magicLinkUrl}</div>

      <p>If you didn't request this login, please ignore this email and contact the system administrator immediately.</p>

      <p>Best regards,<br>DotCTL Security System</p>
    </div>

    <div class="footer">
      <p>&copy; 2025 DotCTL - Dynamic Overhead Traffic Control<br>
      This is a secure admin login email.</p>
    </div>
  </div>
</body>
</html>
`;

// Security alert email template
const getSecurityAlertEmailTemplate = (event: string, details: Record<string, unknown>) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>🚨 DotCTL Security Alert</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .alert { background: #fef2f2; padding: 20px; border-radius: 6px; margin: 30px 0; border-left: 4px solid #dc2626; }
    .details { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; font-family: monospace; font-size: 14px; }
    .footer { background: #1a1a1a; padding: 30px; text-align: center; }
    .footer p { color: #9ca3af; margin: 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Security Alert</h1>
    </div>

    <div class="content">
      <div class="alert">
        <strong>CRITICAL SECURITY EVENT DETECTED</strong>
        <p>A security-related event has been logged in the DotCTL admin system.</p>
      </div>

      <h3>Event Details:</h3>
      <p><strong>Event:</strong> ${event}</p>

      <h3>Additional Information:</h3>
      <div class="details">
        <pre>${JSON.stringify(details, null, 2)}</pre>
      </div>

      <h3>Recommended Actions:</h3>
      <ul>
        <li>Review admin access logs immediately</li>
        <li>Check for any unauthorized access attempts</li>
        <li>Verify admin account security</li>
        <li>Consider enabling additional security measures if needed</li>
      </ul>

      <p>This alert was automatically generated at ${new Date().toISOString()}. If this is expected activity, no further action is required.</p>

      <p>Best regards,<br>DotCTL Security Monitoring System</p>
    </div>

    <div class="footer">
      <p>&copy; 2025 DotCTL - Dynamic Overhead Traffic Control<br>
      This is an automated security alert.</p>
    </div>
  </div>
</body>
</html>
`;

// Send magic link email for admin login
export const sendMagicLinkEmail = async (
  email: string,
  username: string,
  magicLinkUrl: string,
  expiresAt: Date
): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"DotCTL Admin" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: '🔐 Secure Admin Login - DotCTL',
      html: getMagicLinkEmailTemplate(username, magicLinkUrl, expiresAt),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Magic link email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send magic link email to', email, ':', error);
    return false;
  }
};

// Send security alert email
export const sendSecurityAlertEmail = async (
  event: string,
  details: Record<string, unknown>
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.EMAIL_FROM;

    if (!adminEmail) {
      console.warn('No admin alert email configured, skipping security alert');
      return false;
    }

    const mailOptions = {
      from: `"DotCTL Security" <${process.env.EMAIL_FROM}>`,
      to: adminEmail,
      subject: `🚨 SECURITY ALERT: ${event}`,
      html: getSecurityAlertEmailTemplate(event, details),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Security alert email sent for event: ${event}`);
    return true;
  } catch (error) {
    console.error('Failed to send security alert email:', error);
    return false;
  }
};

// Referral notification email template
const getReferralNotificationEmailTemplate = (
  referrerName: string,
  referredName: string,
  bonusMonths: number,
  totalReferrals: number,
  totalRewardMonths: number,
  shareLink: string
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>🎉 Referral Bonus Earned!</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .celebration { background: #f0fdf4; padding: 20px; border-radius: 6px; margin: 30px 0; border-left: 4px solid #10b981; }
    .stats { background: #dbeafe; padding: 20px; border-radius: 6px; margin: 30px 0; text-align: center; }
    .stats-grid { display: flex; justify-content: space-around; margin-top: 20px; }
    .stat-item { text-align: center; }
    .stat-number { font-size: 2rem; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
    .stat-label { font-size: 0.9rem; color: #6b7280; }
    .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { background: #1a1a1a; padding: 30px; text-align: center; }
    .footer p { color: #9ca3af; margin: 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Referral Bonus Earned!</h1>
    </div>

    <div class="content">
      <p>Hello ${referrerName},</p>

      <div class="celebration">
        <h2>🎊 Great News!</h2>
        <p><strong>${referredName}</strong> just joined DotCTL using your referral code and you've earned a new bonus!</p>
      </div>

      <div class="stats">
        <h3>Your Growing Referral Family</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">${totalReferrals}</div>
            <div class="stat-label">Total Referrals</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${bonusMonths}</div>
            <div class="stat-label">Bonus This Time</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${totalRewardMonths}</div>
            <div class="stat-label">Total Reward Months</div>
          </div>
        </div>
      </div>

      <h3>What This Means for You:</h3>
      <ul>
        <li><strong>+${bonusMonths} months free pro access</strong> added to your account</li>
        <li><strong>${12 - (totalRewardMonths % 12)} more months</strong> until you earn another year free</li>
        <li><strong>Keep sharing</strong> - each referral brings you closer to unlimited free pro access</li>
      </ul>

      <p>The more friends you bring in, the more rewards you unlock! Here's how your progress works:</p>

      <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h4>🎯 Referral Milestones:</h4>
        <ul style="margin: 10px 0;">
          <li><strong>Early Influencer:</strong> 5 referrals = +2 bonus months</li>
          <li><strong>Community Builder:</strong> 10 referrals = +3 bonus months</li>
          <li><strong>Referral Champion:</strong> 25 referrals = +5 bonus months</li>
          <li><strong>Viral Force:</strong> 50 referrals = +10 bonus months</li>
          <li><strong>Super Spreader:</strong> 100 referrals = +20 bonus months</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${shareLink}" class="button">🎁 Share & Earn More</a>
      </div>

      <p>Thank you for spreading the word about DotCTL and helping us build an amazing community!</p>

      <p>Happy referring,<br>The DotCTL Team</p>
    </div>

    <div class="footer">
      <p>&copy; 2025 DotCTL - Dynamic Overhead Traffic Control<br>
      This notification celebrates your referral achievements.</p>
    </div>
  </div>
</body>
</html>
`;

// Milestone achievement email template
const getMilestoneEmailTemplate = (
  userName: string,
  milestoneName: string,
  bonusMonths: number,
  totalReferrals: number,
  totalRewardMonths: number,
  shareLink: string
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>🏆 Milestone Achievement Unlocked!</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .achievement { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center; border: 2px solid #fbbf24; }
    .trophy { font-size: 4rem; margin-bottom: 20px; }
    .bonus { background: #10b981; color: white; padding: 15px 25px; border-radius: 50px; font-size: 18px; font-weight: bold; margin: 20px 0; display: inline-block; }
    .stats { background: #dbeafe; padding: 20px; border-radius: 6px; margin: 30px 0; text-align: center; }
    .stats-grid { display: flex; justify-content: space-around; margin-top: 20px; }
    .stat-item { text-align: center; }
    .stat-number { font-size: 2rem; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
    .stat-label { font-size: 0.9rem; color: #6b7280; }
    .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { background: #1a1a1a; padding: 30px; text-align: center; }
    .footer p { color: #9ca3af; margin: 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏆 Milestone Achievement!</h1>
    </div>

    <div class="content">
      <p>Hello ${userName},</p>

      <div class="achievement">
        <div class="trophy">🏆</div>
        <h2>You Unlocked: <strong>${milestoneName}</strong></h2>
        <div class="bonus">+${bonusMonths} BONUS MONTHS FREE PRO ACCESS!</div>
      </div>

      <div class="stats">
        <h3>Your Amazing Referral Progress</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">${totalReferrals}</div>
            <div class="stat-label">Total Referrals</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${bonusMonths}</div>
            <div class="stat-label">Bonus Earned</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${totalRewardMonths}</div>
            <div class="stat-label">Total Reward Months</div>
          </div>
        </div>
      </div>

      <h3>Congratulations!</h3>
      <p>You've reached an incredible milestone that only the most active members of our community achieve. Your efforts in spreading the word about DotCTL are making a real difference!</p>

      <h3>Your Achievement Unlocks:</h3>
      <ul>
        <li><strong>Exclusive Recognition:</strong> ${milestoneName} badge on your profile</li>
        <li><strong>Bonus Rewards:</strong> +${bonusMonths} months added to your free pro access</li>
        <li><strong>Community Status:</strong> Special recognition in our referral leaderboards</li>
        <li><strong>Future Benefits:</strong> Access to exclusive features and early access to new milestones</li>
      </ul>

      <div style="background: #f0f9ff; padding: 20px; border-radius: 6px; margin: 30px 0; border-left: 4px solid #0ea5e9;">
        <h4>🎯 Keep Going!</h4>
        <p>Your journey is just beginning. Each milestone unlocks bigger rewards and more recognition. The top referrers get lifetime benefits, early access to new features, and special community status.</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${shareLink}" class="button">🔥 Continue the Streak</a>
      </div>

      <p>This achievement is a testament to your passion for DotCTL and your commitment to building our community. Thank you for being an amazing community leader!</p>

      <p>Keep up the fantastic work,<br>The DotCTL Team</p>
    </div>

    <div class="footer">
      <p>&copy; 2025 DotCTL - Dynamic Overhead Traffic Control<br>
      This achievement notification celebrates your referral milestone.</p>
    </div>
  </div>
</body>
</html>
`;

// Send referral notification email
export const sendReferralNotificationEmail = async (
  email: string,
  referrerName: string,
  referredName: string,
  bonusMonths: number,
  totalReferrals: number,
  totalRewardMonths: number,
  shareLink: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"DotCTL Community" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: `🎉 ${referredName} joined with your referral! +${bonusMonths} months bonus`,
      html: getReferralNotificationEmailTemplate(
        referrerName,
        referredName,
        bonusMonths,
        totalReferrals,
        totalRewardMonths,
        shareLink
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Referral notification email sent to ${email} for referral: ${referredName}`);
    return true;
  } catch (error) {
    console.error('Failed to send referral notification email to', email, ':', error);
    return false;
  }
};

// Send milestone achievement email
export const sendMilestoneAchievementEmail = async (
  email: string,
  userName: string,
  milestoneName: string,
  bonusMonths: number,
  totalReferrals: number,
  totalRewardMonths: number,
  shareLink: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"DotCTL Community" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: `🏆 Congratulations! You unlocked "${milestoneName}" achievement!`,
      html: getMilestoneEmailTemplate(
        userName,
        milestoneName,
        bonusMonths,
        totalReferrals,
        totalRewardMonths,
        shareLink
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Milestone achievement email sent to ${email} for: ${milestoneName}`);
    return true;
  } catch (error) {
    console.error('Failed to send milestone achievement email to', email, ':', error);
    return false;
  }
};

// OTP verification email template
const getOTPVerificationEmailTemplate = (userName: string, otpCode: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>🔐 DOTCTL Referral Linking Code</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .otp-code { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-align: center; padding: 40px 30px; border-radius: 12px; margin: 30px 0; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace; }
    .warning { background: #fef3c7; padding: 20px; border-radius: 6px; margin: 30px 0; border-left: 4px solid #f59e0b; }
    .footer { background: #1a1a1a; padding: 30px; text-align: center; }
    .footer p { color: #9ca3af; margin: 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 DOTCTL Referral Linking</h1>
    </div>

    <div class="content">
      <p>Hello ${userName},</p>

      <p>You've requested to link your DOTCTL referral rewards to your Python application. Here's your secure verification code:</p>

      <div class="otp-code">${otpCode}</div>

      <div class="warning">
        <strong>⚡ Important Security Information:</strong>
        <ul>
          <li>This code expires in <strong>10 minutes</strong></li>
          <li>Can only be used once</li>
          <li>Enter this code in your DOTCTL application</li>
          <li>Do not share this code with anyone</li>
        </ul>
      </div>

      <h3>What happens after verification?</h3>
      <ul>
        <li>Your referral rewards are converted to premium license time</li>
        <li>Your device gets permanent access to premium features</li>
        <li>Future referrals automatically extend your license</li>
        <li>You can check your referral status anytime in the app</li>
      </ul>

      <p>If you didn't request this code, someone may be trying to access your referral rewards. Please contact us immediately if this wasn't you.</p>

      <p>Thank you for being part of the DOTCTL community!</p>

      <p>Best regards,<br>The DOTCTL Team</p>
    </div>

    <div class="footer">
      <p>&copy; 2025 DOTCTL - Dynamic Overhead Traffic Control<br>
      This verification code links your referral rewards to premium access.</p>
    </div>
  </div>
</body>
</html>
`;

// Send OTP verification email for referral linking
export const sendOTPVerificationEmail = async (
  email: string,
  userName: string,
  otpCode: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"DOTCTL Referral System" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: '🔐 Your DOTCTL Referral Linking Code',
      html: getOTPVerificationEmailTemplate(userName, otpCode),
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send OTP verification email to', email, ':', error);
    return false;
  }
};
