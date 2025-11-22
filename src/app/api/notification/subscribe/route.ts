import { NextRequest, NextResponse } from 'next/server';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
  userAgent?: string;
}

// Simple in-memory storage for demo (use Redis/database in production)
const subscriptions = new Map<string, PushSubscriptionData>();

export async function POST(request: NextRequest) {
  try {
    const { userId, endpoint, keys } = await request.json();

    // Store the subscription for this user
    const userAgent = request.headers.get('user-agent');
    subscriptions.set(userId || 'default-user', {
      endpoint,
      keys,
      createdAt: new Date(),
      ...(userAgent && { userAgent }),
    });

    console.log('Push subscription stored for user:', userId || 'default-user');

    return NextResponse.json({
      success: true,
      message: 'Subscription registered successfully'
    });

  } catch (error) {
    console.error('Subscription registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register subscription' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const subscription = subscriptions.get(userId || 'default-user');

    return NextResponse.json({
      subscription: subscription || null
    });

  } catch (error) {
    console.error('Subscription lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}
