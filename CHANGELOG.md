# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Initial Release

### Added
- Referral management system with form submission and tracking
- Admin dashboard with user management, analytics, and settings
- Referral linking via OTP verification and device pairing
- Multi-language support (i18n) for English, Arabic, German, Spanish, French, and Russian
- Email通知 and push notifications for milestones and updates
- Authentication with JWT tokens and magic link login for admins
- Rate limiting using Redis
- QR code generation for referral links
- MongoDB integration for data persistence
- Redis for caching and sessions
- Responsive UI with Tailwind CSS
- API endpoints for referrals, admin functions, and notifications
- Environment-based configuration management

### Technical
- Built with Next.js 16, React 19, and TypeScript
- Database: MongoDB with Mongoose
- Caching: Redis
- Authentication: Custom JWT implementation
- Email: Nodemailer integration
- Notifications: Web Push API
- Internationalization: i18next framework
- Styling: Tailwind CSS
- Linting: ESLint
