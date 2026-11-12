import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { signToken } from '@/lib/auth-server';

const DEMO_ACCOUNTS: Record<string, { name: string; role: 'customer' | 'shop_owner' | 'delivery_partner'; phone: string; shopName?: string }> = {
  'demo@quickbasket.com': { name: 'Demo Customer', role: 'customer', phone: '+91 98765 43210' },
  'owner@quickbasket.com': { name: 'Demo Merchant', role: 'shop_owner', phone: '+91 98765 43211', shopName: 'Fresh Mart Supermarket' },
  'rider@quickbasket.com': { name: 'Demo Rider', role: 'delivery_partner', phone: '+91 98765 43212' },
};

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

    // Auto-bootstrap demo accounts if logging in for first time
    if (!user && DEMO_ACCOUNTS[cleanEmail] && password === 'password123') {
      const demoMeta = DEMO_ACCOUNTS[cleanEmail];
      user = new User({
        name: demoMeta.name,
        email: cleanEmail,
        phone: demoMeta.phone,
        password: 'password123',
        role: demoMeta.role,
        isActive: true,
        shopDetails: demoMeta.shopName
          ? {
              shopName: demoMeta.shopName,
              category: 'Daily Essentials & Groceries',
              address: 'Downtown Hyperlocal Market',
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
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (role && user.role !== role) {
      const friendlyRoleNames: Record<string, string> = {
        customer: 'Customer',
        shop_owner: 'Shop Owner',
        delivery_partner: 'Delivery Partner',
        admin: 'Administrator',
      };
      return NextResponse.json(
        {
          success: false,
          message: `This account is registered as a ${friendlyRoleNames[user.role] || user.role}. Please select the ${friendlyRoleNames[user.role]} role tab to log in.`,
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

