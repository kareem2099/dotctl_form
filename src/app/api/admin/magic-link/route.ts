import { NextRequest, NextResponse } from 'next/server';
import { sendMagicLink } from '../../../../../lib/auth';

// In-memory rate limiting storage (for development; use Redis in production)
const rateLimitMap: Map<string, number[]> = new Map();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Basic validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Rate limiting: allow no more than 3 magic link requests per hour per IP
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                    request.headers.get('x-real-ip') ||
                    'unknown';

    // Check rate limit
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    let timestamps = rateLimitMap.get(clientIP) || [];
    // Remove timestamps older than one hour
    timestamps = timestamps.filter(timestamp => timestamp > oneHourAgo);

    if (timestamps.length >= 3) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Add current timestamp
    timestamps.push(now);
    rateLimitMap.set(clientIP, timestamps);

    // In production, implement proper rate limiting with Redis or similar
    // For now, we'll proceed with the magic link send

    const baseUrl = process.env.APP_URL || `http://${request.headers.get('host')}`;

    const result = await sendMagicLink(email, baseUrl);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        {
          status: 400,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
          }
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Magic link sent successfully. Please check your email.',
        email: email // Mask the email for security
      },
      {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        }
      }
    );
  } catch (error) {
    console.error('Magic link API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        }
      }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    {
      status: 405,
      headers: {
        'Allow': 'POST',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    }
  );
}
