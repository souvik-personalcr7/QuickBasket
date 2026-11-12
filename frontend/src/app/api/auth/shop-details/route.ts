import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getUserFromRequest } from '@/lib/auth-server';

export async function PATCH(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload?.id) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const user = await User.findById(payload.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    user.shopDetails = {
      ...(user.shopDetails || {}),
      ...body,
      isApproved: true,
    };

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Storefront details updated successfully',
      data: { user: user.toJSON() },
    });
  } catch (error: any) {
    console.error('API /auth/shop-details PATCH error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update shop details' },
      { status: 500 }
    );
  }
}

