import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getUserFromRequest } from '@/lib/auth-server';

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const caller = getUserFromRequest(req);
    const body = await req.json();
    const isAvailable = Boolean(body.isAvailable);

    if (caller?.id) {
      const user = await User.findById(caller.id);
      if (user) {
        user.deliveryDetails = {
          ...(user.deliveryDetails || {}),
          isAvailable,
        };
        await user.save();
        return NextResponse.json({
          success: true,
          message: `Duty status updated: Rider is now ${isAvailable ? 'ONLINE' : 'OFFLINE'}`,
          data: { isAvailable, user: user.toJSON() },
        });
      }
    }

    // If caller id provided in body as fallback
    if (body.userId) {
      const user = await User.findById(body.userId);
      if (user) {
        user.deliveryDetails = {
          ...(user.deliveryDetails || {}),
          isAvailable,
        };
        await user.save();
        return NextResponse.json({
          success: true,
          message: `Duty status updated: Rider is now ${isAvailable ? 'ONLINE' : 'OFFLINE'}`,
          data: { isAvailable, user: user.toJSON() },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Duty status toggled: ${isAvailable ? 'ONLINE' : 'OFFLINE'}`,
      data: { isAvailable },
    });
  } catch (error: any) {
    console.error('API /delivery/duty-status PATCH error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update duty status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return PATCH(req);
}

