import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { User } from '@/models/User';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const filter: Record<string, any> = { isAvailable: true };

    if (shopId) {
      filter.shopId = shopId;
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
        { shopName: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: products.map((p) => p.toJSON()),
    });
  } catch (error: any) {
    console.error('API /products GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userPayload = getUserFromRequest(req);
    const body = await req.json();

    let resolvedShopId = body.shopId || userPayload?.id || '';
    let resolvedShopName = body.shopName || '';

    // If shop owner is authenticated, retrieve shop details from User doc if missing
    if (userPayload?.id) {
      const userDoc = await User.findById(userPayload.id);
      if (userDoc) {
        resolvedShopId = userDoc.id;
        resolvedShopName =
          userDoc.shopDetails?.shopName?.trim() ||
          userDoc.name + "'s Store";
      }
    }

    if (!resolvedShopId) {
      resolvedShopId = 'guest_shop';
      resolvedShopName = resolvedShopName || 'Local Fresh Store';
    }

    const product = new Product({
      name: body.name,
      category: body.category || 'General',
      unit: body.unit || '1 unit',
      price: Number(body.price),
      originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
      image: body.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
      stock: body.stock !== undefined ? Number(body.stock) : 50,
      shopId: resolvedShopId,
      shopName: resolvedShopName,
      isAvailable: true,
    });

    await product.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Product created successfully',
        data: product.toJSON(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API /products POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create product' },
      { status: 400 }
    );
  }
}

