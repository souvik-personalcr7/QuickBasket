import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { signToken } from '@/lib/auth-server';
import { normalizeEmail, normalizePhoneNumber } from '@/lib/normalize';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { name, email, phone, password, role, address, shopDetails, deliveryDetails, avatar } = body;

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { success: false, message: 'Name, email, phone, and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhoneNumber(phone);

    // 1. Check existing email across all user roles
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: 'This email address is already registered. Please use another email.' },
        { status: 409 }
      );
    }

    // 2. Check existing phone across all user roles
    const existingPhone = await User.findOne({
      $or: [
        { phone: normalizedPhone },
        { phone: phone.trim() },
      ],
    });
    if (existingPhone) {
      return NextResponse.json(
        { success: false, message: 'This phone number is already registered. Please use another phone number.' },
        { status: 409 }
      );
    }

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password,
      role: role || 'customer',
      avatar: avatar || '',
      address: address || {},
      shopDetails: role === 'shop_owner' ? shopDetails : undefined,
      deliveryDetails: role === 'delivery_partner' ? deliveryDetails : undefined,
      isActive: true,
    });

    await user.save();

    const token = signToken(user);

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        data: {
          user: user.toJSON(),
          token,
        },
      },
      { status: 201 }
    );

    // Set HTTP-only cookie
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    // Handle race-condition MongoDB Duplicate Key Error (E11000)
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

    console.error('API /auth/register POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}

