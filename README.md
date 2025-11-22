# DotCtl Form

A comprehensive referral management web application built with Next.js, featuring an admin dashboard, user forms, referral tracking, notifications, and multi-language support.

## Features

- **Referral Management**: Complete system for creating and tracking referral links with OTP verification
- **Admin Dashboard**: Secure admin panel for user management, analytics, and settings
- **Internationalization**: Multi-language support (English, Arabic, German, Spanish, French, Russian) using i18next
- **Notifications**: Email and push notifications for referral milestones and updates
- **Authentication**: Secure login with JWT tokens and magic link authentication
- **Rate Limiting**: Built-in protection against abuse using Redis
- **Data Storage**: MongoDB for persistent data, Redis for caching and sessions
- **QR Code Generation**: Automatic QR code creation for referral links
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

## Prerequisites

- Node.js 18.x or higher
- MongoDB database
- Redis server
- SMTP server for email notifications (optional)

## Getting Started

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Copy the example environment file and configure your variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration (database URLs, secrets, etc.)

3. Set up the admin user:

```bash
npm run setup-admin
```

### Running the Application

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

### Building for Production

```bash
npm run build
npm run start
```

## Environment Variables

Key environment variables to configure:

- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection URL
- `NEXTAUTH_SECRET`: Secret for Next.js authentication
- `SMTP_HOST`, `SMTP_PORT`, etc.: Email server configuration
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: Admin credentials (hashed during setup)

See the full list in `.env.example` (create if not present).

## Project Structure

- `src/app/`: Next.js app router pages and API routes
- `lib/`: Utility functions and configurations (auth, email, database, etc.)
- `models/`: MongoDB schemas
- `public/locales/`: Translation files

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

## Deploy on Vercel

### Prerequisites for Vercel Deployment

Before deploying to Vercel, you'll need to set up the following production services:

1. **MongoDB Database**: Create a [MongoDB Atlas](https://www.mongodb.com/atlas) account and database
2. **Redis Cache**: Use [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted) or similar service
3. **Email Service**: Configure SMTP (Gmail, SendGrid, AWS SES, etc.)

### Vercel Deployment Steps

1. **Connect Repository**:
   - Import your GitHub repository into [Vercel](https://vercel.com)
   - Vercel will automatically detect Next.js and configure the build settings

2. **Configure Environment Variables**:
   Set the following environment variables in your Vercel project settings:

   ```
   # Database
   MONGO_URI=your-mongodb-connection-string
   MONGO_DB_NAME=dotctl_db

   # Redis
   REDIS_URL=your-redis-connection-url

   # Security - Generate random strings
   JWT_SECRET=your-64-character-random-string
   JWT_REFRESH_SECRET=your-64-character-random-string
   NEXTAUTH_SECRET=your-32-character-random-string

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   ADMIN_ALERT_EMAIL=admin@yourdomain.com

   # Application
   APP_URL=https://your-vercel-domain.vercel.app
   NODE_ENV=production

   # Optional
   TRUST_PROXY=true
   REDIS_MOCK=false
   ```

3. **Database Setup**:
   - Ensure your MongoDB Atlas cluster allows connections from `0.0.0.0/0` (all IPs)
   - Create necessary collections (they will be auto-created by the app)

4. **One-time Admin Setup**:
   After deployment, you'll need to run the admin setup to create your admin user:
   ```bash
   # Connect to your production database and run:
   npm run setup-admin
   ```
   Or create the admin user manually through MongoDB Atlas.

5. **Custom Domain** (Optional):
   - Add your custom domain in Vercel dashboard
   - Update the `APP_URL` environment variable with your domain

### Environment Variables Security

⚠️ **Important**: Never commit sensitive environment variables to your repository. Always use Vercel's environment variable dashboard for production secrets.

### Build Configuration

Vercel automatically detects Next.js, but if needed, you can configure:
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Database Connection

The app uses serverless-compatible database connections that work with Vercel's serverless functions. MongoDB Atlas provides connection pooling suitable for serverless environments.

Check out the [official Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for additional details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

Please see our [Security Policy](SECURITY.md) for information on reporting security vulnerabilities.
