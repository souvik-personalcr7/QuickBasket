import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getUserFromRequest } from '@/lib/auth-server';
import { normalizeEmail, normalizePhoneNumber } from '@/lib/normalize';

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

    if (body.name !== undefined) user.name = body.name.trim();
    if (body.avatar !== undefined) user.avatar = body.avatar;

    if (body.phone !== undefined) {
      const normalizedPhone = normalizePhoneNumber(body.phone);
      // Check if phone belongs to another account
      const existingPhone = await User.findOne({
        phone: normalizedPhone,
        _id: { $ne: user._id },
      });
      if (existingPhone) {
        return NextResponse.json(
          { success: false, message: 'This phone number is already registered. Please use another phone number.' },
          { status: 409 }
        );
      }
      user.phone = normalizedPhone;
    }

    if (body.email !== undefined) {
      const normalizedEmail = normalizeEmail(body.email);
      // Check if email belongs to another account
      const existingEmail = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });
      if (existingEmail) {
        return NextResponse.json(
          { success: false, message: 'This email address is already registered. Please use another email.' },
          { status: 409 }
        );
      }
      user.email = normalizedEmail;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: user.toJSON() },
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      const keyValue = error?.keyValue;
      const rawMsg = error?.message || '';
      let message = 'Duplicate value encountered. Please use another value.';

      if ((keyValue && 'email' in keyValue) || rawMsg.includes('email_1') || rawMsg.includes('email:')) {
        message = 'This email address is already registered. Please use another email.';
      } else if ((keyValue && 'phone' in keyValue) || rawMsg.includes('phone_1') || rawMsg.includes('phone:')) {
        message = 'This phone number is already registered. Please use another phone number.';
      }

      return NextResponse.json({ success: false, message }, { status: 409 });
    }

    console.error('API /auth/profile PATCH error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

