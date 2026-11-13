import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload || !payload.id) {
      return NextResponse.json({
        success: false,
        message: 'Not authenticated',
        data: null,
      });
    }

    await connectDB();
    const user = await User.findById(payload.id);
    if (!user) {
      // Clear stale token cookie if user was removed or not in cloud DB
      const response = NextResponse.json({
        success: false,
        message: 'Session not found in database',
        data: null,
      });
      response.cookies.delete('token');
      return response;
    }

    return NextResponse.json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error: any) {
    console.error('API /auth/me GET error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Authentication check failed',
      data: null,
    });
  }
}
