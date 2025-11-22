import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '../../../../../lib/auth';
import dbConnect from '../../../../../lib/mongodb';
import BetaUser from '../../../../../models/BetaUser';

interface LeanBetaUser {
  _id: string | unknown;
  name: string;
  email: string;
  skillLevel: string;
  featureInterests: string[];
  position: number;
  useCase: string;
  referralSource: string;
  submittedAt: Date | string;
  wantsUpdates: boolean;
}

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

    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const skillFilter = url.searchParams.get('skill') || '';
    const sortBy = url.searchParams.get('sort') || '-submittedAt'; // Default sort by newest first

    // Build query
    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { useCase: { $regex: search, $options: 'i' } }
      ];
    }

    if (skillFilter) {
      query.skillLevel = skillFilter;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await BetaUser.countDocuments(query);

    // Get users with sorting and pagination
    const users = await BetaUser.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .select('name email skillLevel featureInterests position useCase referralSource submittedAt wantsUpdates')
      .lean();

    // Transform data for frontend
    const transformedUsers = (users as unknown as LeanBetaUser[]).map((user) => ({
      _id: String(user._id),
      name: user.name,
      email: user.email,
      skillLevel: user.skillLevel,
      featureInterests: user.featureInterests || [],
      position: user.position || 0,
      useCase: user.useCase,
      referralSource: user.referralSource || 'unknown',
      submittedAt: user.submittedAt ? new Date(user.submittedAt).toISOString() : new Date().toISOString(),
      wantsUpdates: user.wantsUpdates || true
    }));

    return NextResponse.json(
      {
        success: true,
        users: transformedUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        filters: {
          search,
          skill: skillFilter,
          sort: sortBy
        }
      },
      {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  } catch (error) {
    console.error('Users API error:', error);
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

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    {
      status: 405,
      headers: {
        'Allow': 'GET',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    }
  );
}
