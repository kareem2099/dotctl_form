import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '../../../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get client IP and user agent for security logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Attempt authentication
    const result = await authenticateAdmin(email, password, ipAddress, userAgent);

    if (!result.success) {
      // Don't leak information about why login failed
      return NextResponse.json(
        {
          error: result.error,
          requires2FA: result.requires2FA,
          user: result.requires2FA ? result.user : undefined
        },
        {
          status: result.requires2FA ? 200 : 401,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
          }
        }
      );
    }

    // Set secure cookies for tokens
    const response = NextResponse.json(
      {
        success: true,
        token: result.token,
        refreshToken: result.refreshToken,
        user: result.user,
        message: 'Login successful'
      },
      {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        }
      }
    );

    // Note: In production, you'd set secure httpOnly cookies instead of returning tokens
    // For now, we're returning them for the client-side implementation

    return response;
  } catch (error) {
    console.error('Admin login error:', error);

    // Log security event here
    try {
      // await logSecurityEvent('Login System Error', { error: error.message }, 'high');
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }

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
