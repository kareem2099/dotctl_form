import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint for browser push notifications
export async function POST(request: NextRequest) {
  try {
    const { userId = 'default-user' } = await request.json();

    // Store userId for future push notification targeting
    console.log('Test notification requested for user:', userId);

    // In a real implementation, this would:
    // 1. Get the user's push subscription from database
    // 2. Send push notification via web push API (using web-push library)
    // 3. Use VAPID keys for authentication

    // For now, just return success - the frontend handles showing the notification

    return NextResponse.json({
      success: true,
      message: 'Test notification triggered! Check your browser.',
      notification: {
        title: '🎉 Referral Test!',
        body: 'Push notifications are working! You\'ll get real updates when friends join.',
        icon: '/favicon.ico',
        tag: 'referral-test'
      }
    });

  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}
