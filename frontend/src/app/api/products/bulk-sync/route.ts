import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { User } from '@/models/User';
import { getUserFromRequest } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userPayload = getUserFromRequest(req);
    const body = await req.json();
    const items = Array.isArray(body.products) ? body.products : [];

    if (items.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    let defaultShopId = userPayload?.id || '';
    let defaultShopName = 'Hyperlocal Store';

    if (userPayload?.id) {
      const userDoc = await User.findById(userPayload.id);
      if (userDoc) {
        defaultShopId = userDoc.id;
        defaultShopName =
          userDoc.shopDetails?.shopName?.trim() ||
          userDoc.name + "'s Store";
      }
    }

    const synced = [];

    for (const item of items) {
      if (!item || !item.name) continue;

      const shopId = item.shopId || defaultShopId || 'general_shop';
      const shopName = item.shopName || defaultShopName;

      // Check if product with identical name already exists for this shop
      const existing = await Product.findOne({
        name: { $regex: `^${item.name.trim()}$`, $options: 'i' },
        $or: [{ shopId }, { shopName }],
      });

      if (existing) {
        // Update stock / price if provided
        if (item.price) existing.price = Number(item.price);
        if (item.stock !== undefined) existing.stock = Number(item.stock);
        if (item.image && !item.image.includes('placeholder')) existing.image = item.image;
        await existing.save();
        synced.push(existing.toJSON());
      } else {
        const newProd = new Product({
          name: item.name.trim(),
          category: item.category || 'General',
          unit: item.unit || '1 unit',
          price: Number(item.price) || 0,
          originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
          stock: item.stock !== undefined ? Number(item.stock) : 50,
          image: item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
          shopId,
          shopName,
          isAvailable: true,
        });
        await newProd.save();
        synced.push(newProd.toJSON());
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${synced.length} product(s) to cloud database`,
      data: synced,
    });
  } catch (error: any) {
    console.error('API /products/bulk-sync POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to sync products' },
      { status: 500 }
    );
  }
}

