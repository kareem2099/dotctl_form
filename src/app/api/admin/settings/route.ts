import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '../../../../../lib/auth';
import dbConnect from '../../../../../lib/mongodb';
import Settings from '../../../../../models/Settings';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        {
          status: 401,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
          }
        }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded || !['admin', 'super_admin'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        {
          status: 403,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
          }
        }
      );
    }

    await dbConnect();

    const settings = await Settings.getSingleton();

    return NextResponse.json(
      {
        success: true,
        settings: {
          ...settings.toObject(),
          // Mask sensitive information
          email: {
            ...settings.email,
            smtpPassword: settings.email.smtpPassword ? '********' : ''
          },
          notifications: {
            ...settings.notifications,
            slackWebhookUrl: settings.notifications.slackWebhookUrl ? '********' : '',
            discordWebhookUrl: settings.notifications.discordWebhookUrl ? '********' : ''
          }
        }
      },
      {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  } catch (error) {
    console.error('Settings GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        }
      }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        {
          status: 401,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
          }
        }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded || !['super_admin'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Super admin access required' },
        {
          status: 403,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
          }
        }
      );
    }

    await dbConnect();

    const body = await request.json();

    // Basic validation
    if (!body.updatedBy) {
      return NextResponse.json(
        { error: 'Updated by user ID is required' },
        { status: 400 }
      );
    }

    // Get existing settings
    const existingSettings = await Settings.getSingleton();

    // Preserve masked fields if they're not being updated
    if (body.email && body.email.smtpPassword === '********') {
      body.email.smtpPassword = existingSettings.email.smtpPassword;
    }
    if (body.notifications) {
      if (body.notifications.slackWebhookUrl === '********') {
        body.notifications.slackWebhookUrl = existingSettings.notifications.slackWebhookUrl;
      }
      if (body.notifications.discordWebhookUrl === '********') {
        body.notifications.discordWebhookUrl = existingSettings.notifications.discordWebhookUrl;
      }
    }

    // Update settings
    const updatedSettings = await Settings.findOneAndUpdate(
      {},
      {
        ...body,
        updatedBy: decoded.userId,
        updatedAt: new Date()
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    return NextResponse.json(
      {
        success: true,
        settings: {
          ...updatedSettings.toObject(),
          // Mask sensitive information
          email: {
            ...updatedSettings.email,
            smtpPassword: updatedSettings.email.smtpPassword ? '********' : ''
          },
          notifications: {
            ...updatedSettings.notifications,
            slackWebhookUrl: updatedSettings.notifications.slackWebhookUrl ? '********' : '',
            discordWebhookUrl: updatedSettings.notifications.discordWebhookUrl ? '********' : ''
          }
        }
      },
      {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        }
      }
    );
  } catch (error: unknown) {
    console.error('Settings PUT API error:', error);

    const err = error as { name?: string; errors?: Record<string, { message: string }>; message?: string };
    if (err.name === 'ValidationError') {
      const validationErrors: { [key: string]: string } = {};
      if (err.errors) {
        for (const field in err.errors) {
          validationErrors[field] = err.errors[field].message;
        }
      }

      return NextResponse.json(
        { error: 'Validation failed', validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      {
        status: 500,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        }
      }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        {
          status: 401,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
          }
        }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded || !['admin', 'super_admin'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        {
          status: 403,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
          }
        }
      );
    }

    await dbConnect();

    const body = await request.json();

    // Basic validation
    if (!body.updatedBy) {
      return NextResponse.json(
        { error: 'Updated by user ID is required' },
        { status: 400 }
      );
    }

    // Only super admins can update security and email settings
    if (!['super_admin'].includes(decoded.role)) {
      const restrictedFields = ['security', 'email', 'advanced'];
      const hasRestrictedField = restrictedFields.some(field =>
        body.hasOwnProperty(field)
      );

      if (hasRestrictedField) {
        return NextResponse.json(
          { error: 'Super admin privileges required for security, email, and advanced settings' },
          { status: 403 }
        );
      }
    }

    // Get existing settings
    const existingSettings = await Settings.getSingleton();

    // Preserve masked fields if they're not being updated
    if (body.email && body.email.smtpPassword === '********') {
      body.email.smtpPassword = existingSettings.email.smtpPassword;
    }
    if (body.notifications) {
      if (body.notifications.slackWebhookUrl === '********') {
        body.notifications.slackWebhookUrl = existingSettings.notifications.slackWebhookUrl;
      }
      if (body.notifications.discordWebhookUrl === '********') {
        body.notifications.discordWebhookUrl = existingSettings.notifications.discordWebhookUrl;
      }
    }

    // Deep merge the updates
    const currentSettings = existingSettings.toObject();
    const updatedSettingsData = deepMerge(currentSettings, body);

    // Update settings
    const updatedSettings = await Settings.findOneAndUpdate(
      {},
      {
        ...updatedSettingsData,
        updatedBy: decoded.userId,
        updatedAt: new Date()
      },
      {
        new: true,
        runValidators: true
      }
    );

    return NextResponse.json(
      {
        success: true,
        settings: {
          ...updatedSettings!.toObject(),
          // Mask sensitive information
          email: {
            ...updatedSettings!.email,
            smtpPassword: updatedSettings!.email.smtpPassword ? '********' : ''
          },
          notifications: {
            ...updatedSettings!.notifications,
            slackWebhookUrl: updatedSettings!.notifications.slackWebhookUrl ? '********' : '',
            discordWebhookUrl: updatedSettings!.notifications.discordWebhookUrl ? '********' : ''
          }
        }
      },
      {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        }
      }
    );
  } catch (error: unknown) {
    console.error('Settings PATCH API error:', error);

    const err = error as { name?: string; errors?: Record<string, { message: string }>; message?: string };
    if (err.name === 'ValidationError') {
      const validationErrors: { [key: string]: string } = {};
      if (err.errors) {
        for (const field in err.errors) {
          validationErrors[field] = err.errors[field].message;
        }
      }

      return NextResponse.json(
        { error: 'Validation failed', validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      {
        status: 500,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        }
      }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    {
      status: 405,
      headers: {
        'Allow': 'GET, PUT, PATCH',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    }
  );
}

// Utility function for deep merging objects
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      const sourceValue = source[key as keyof T];
      if (sourceValue !== undefined) {
        if (isObject(sourceValue) && key in target && isObject(target[key as keyof T])) {
          (output as Record<string, unknown>)[key] = deepMerge(
            target[key as keyof T] as Record<string, unknown>,
            sourceValue
          );
        } else {
          (output as Record<string, unknown>)[key] = sourceValue;
        }
      }
    });
  }

  return output;
}

function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}
