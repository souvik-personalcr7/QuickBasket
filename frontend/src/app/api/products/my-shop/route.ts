import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userPayload = getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const queryShopId = searchParams.get('shopId');

    const shopId = userPayload?.id || queryShopId;

    if (!shopId) {
      // If no token or query param, return empty list or all products for guest
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const products = await Product.find({
      $or: [{ shopId }, { shopId: `shop_${userPayload?.email}` }],
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: products.map((p) => p.toJSON()),
    });
  } catch (error: any) {
    console.error('API /products/my-shop GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch shop products' },
      { status: 500 }
    );
  }
}

