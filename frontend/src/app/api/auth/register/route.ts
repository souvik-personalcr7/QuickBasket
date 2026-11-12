import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { signToken } from '@/lib/auth-server';

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

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
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
    console.error('API /auth/register POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}

