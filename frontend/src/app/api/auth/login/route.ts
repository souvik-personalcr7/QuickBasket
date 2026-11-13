import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, UserRole } from '@/models/User';
import { signToken } from '@/lib/auth-server';

function formatFriendlyName(email: string): string {
  const prefix = email.split('@')[0];
  if (prefix.toLowerCase().includes('souvik')) {
    return 'Souvik Das';
  }
  // Convert email prefix like "john_doe" or "john.doe" to "John Doe"
  const parts = prefix.replace(/[^a-zA-Z0-9]/g, ' ').split(' ').filter(Boolean);
  if (parts.length > 0) {
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }
  return 'User';
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail }).select('+password');

    // If user does not exist in MongoDB Atlas yet, auto-register them seamlessly!
    if (!user) {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, message: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }

      const assignedRole: UserRole =
        role === 'shop_owner' || role === 'delivery_partner' || role === 'admin'
          ? role
          : 'customer';

      const friendlyName = formatFriendlyName(cleanEmail);

      user = new User({
        name: friendlyName,
        email: cleanEmail,
        phone: '+91 98765 43210',
        password,
        role: assignedRole,
        isActive: true,
        shopDetails:
          assignedRole === 'shop_owner'
            ? {
                shopName: `${friendlyName}'s Store`,
                category: 'Retail & Grocery',
                address: 'Hyperlocal Market',
                isApproved: true,
              }
            : undefined,
      });

      await user.save();

      // Reload with password field
      user = await User.findOne({ email: cleanEmail }).select('+password');
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Could not authenticate user' },
        { status: 500 }
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Incorrect password. Please verify your password and try again.' },
        { status: 401 }
      );
    }

    if (role && user.role !== role) {
      // If user selected a different role on the login tab, allow switching/updating their active role
      user.role = role;
      if (role === 'shop_owner' && !user.shopDetails?.shopName) {
        user.shopDetails = {
          shopName: `${user.name}'s Store`,
          category: 'Retail & Grocery',
          address: 'Hyperlocal Market',
          isApproved: true,
        };
      }
      await user.save();
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
