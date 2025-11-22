#!/bin/bash

# DotCtl Form - Service Setup Script
# This script helps set up the required production services

echo "🚀 DotCtl Form - Service Setup Helper"
echo "====================================="
echo ""

echo "This script will guide you through setting up the required services for production deployment."
echo ""

# MongoDB Atlas Setup Helper
echo "1. 🍃 MongoDB Atlas Setup:"
echo "   - Go to: https://cloud.mongodb.com/"
echo "   - Create account and free cluster"
echo "   - Create database user with read/write permissions"
echo "   - Allow access from all IP addresses (0.0.0.0/0)"
echo "   - Get connection string from 'Connect' -> 'Drivers'"
echo "   - Replace <password> and <database> in the connection string"
echo ""

# Upstash Redis Setup Helper
echo "2. 🔴 Upstash Redis Setup:"
echo "   - Go to: https://console.upstash.com/"
echo "   - Create free Redis database"
echo "   - Note the REDIS_URL from the dashboard"
echo "   - Ensure it's the REST API endpoint (starts with 'https://')"
echo ""

# Email Service Setup Helper
echo "3. 📧 Email Service Setup:"
echo "   Choose one option:"
echo ""
echo "   Option A - Gmail SMTP:"
echo "   - Enable 2FA on Gmail account"
echo "   - Generate App Password: https://myaccount.google.com/apppasswords"
echo "   - EMAIL_HOST: smtp.gmail.com"
echo "   - EMAIL_PORT: 587"
echo "   - EMAIL_SECURE: false"
echo "   - EMAIL_USER: your-gmail@gmail.com"
echo "   - EMAIL_PASS: your-16-char-app-password"
echo ""
echo "   Option B - SendGrid:"
echo "   - Go to: https://sendgrid.com/"
echo "   - Create account and verify single sender"
echo "   - Get API key from Settings -> API Keys"
echo "   - EMAIL_HOST: smtp.sendgrid.net"
echo "   - EMAIL_PORT: 587"
echo "   - EMAIL_SECURE: false"
echo "   - EMAIL_USER: apikey"
echo "   - EMAIL_PASS: your-sendgrid-api-key"
echo ""

# Environment Variables Template
echo "4. 🔧 Environment Variables Template:"
echo "   Copy this to your Vercel project environment variables:"
echo ""
cat << EOF
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dotctl_db
MONGO_DB_NAME=dotctl_db

# Redis
REDIS_URL=https://your-redis-endpoint.upstash.io

# Security (Generate random strings)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
NEXTAUTH_SECRET=$(openssl rand -hex 16)

# Email Configuration (fill based on service chosen above)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
ADMIN_ALERT_EMAIL=admin@yourdomain.com

# Application
APP_URL=https://your-project.vercel.app
NODE_ENV=production

# Optional settings
TRUST_PROXY=true
REDIS_MOCK=false
EOF

echo ""
echo "5. 📋 Next Steps:"
echo "   - Set up each service using the guides above"
echo "   - Copy environment variables to Vercel dashboard"
echo "   - Import your GitHub repo to Vercel"
echo "   - Deploy and test!"
echo ""
echo "6. 🔍 Testing Your Services:"
echo "   - After deployment, visit: https://your-domain.vercel.app/api/health"
echo "   - Should show all services as 'healthy'"
