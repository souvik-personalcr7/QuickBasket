import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, UserRole } from '@/models/User';
import { signToken } from '@/lib/auth-server';
import { normalizeEmail, normalizePhoneNumber } from '@/lib/normalize';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email or phone number and password are required' },
        { status: 400 }
      );
    }

    const rawIdentifier = email.trim();
    const cleanEmail = normalizeEmail(rawIdentifier);
    const cleanPhone = normalizePhoneNumber(rawIdentifier);

    // Find user by either email or phone number
    const user = await User.findOne({
      $or: [
        { email: cleanEmail },
        ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        { phone: rawIdentifier },
      ],
    }).select('+password');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email/phone number or password.' },
        { status: 401 }
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Incorrect password. Please verify your password and try again.' },
        { status: 401 }
      );
    }

    // Role boundary validation: Prevent logging into wrong portal
    if (role && user.role !== role && user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Already Used',
        },
        { status: 403 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'This account has been deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    const token = signToken(user);

    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: user.toJSON(),
        token,
      },
    });

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
    console.error('API /auth/login POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
