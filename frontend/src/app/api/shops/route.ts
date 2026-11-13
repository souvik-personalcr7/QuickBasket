import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Product } from '@/models/Product';

export async function GET() {
  try {
    await connectDB();

    // 1. Fetch all registered shop owners
    const shopOwners = await User.find({
      role: { $in: ['shop_owner', 'admin'] },
      isActive: true,
    }).select('-password');

    // 2. Fetch all products to aggregate counts per shop
    const products = await Product.find({ isAvailable: true }).select('shopId shopName');

    const shopMap = new Map<string, any>();

    // Add registered shop owners to shopMap
    for (const owner of shopOwners) {
      const shopName =
        owner.shopDetails?.shopName?.trim() ||
        (owner.name ? `${owner.name}'s Store` : 'Local Store');
      const shopId = owner.id || owner._id.toString();
      const normKey = shopName.toLowerCase().trim();

      const count = products.filter(
        (p) =>
          p.shopId === shopId ||
          p.shopId === `shop_${owner.email}` ||
          (p.shopName && p.shopName.toLowerCase() === normKey)
      ).length;

      shopMap.set(normKey, {
        id: shopId,
        name: shopName,
        category: owner.shopDetails?.category || 'Retail & Grocery',
        rating: 4.8,
        reviewCount: 'Verified Store',
        deliveryTime: '20-30 mins',
        isFreeDelivery: true,
        image:
          owner.shopDetails?.image ||
          'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800',
        address:
          owner.shopDetails?.address ||
          owner.address?.street ||
          'Hyperlocal Market',
        ownerId: shopId,
        ownerEmail: owner.email,
        isOpen: owner.shopDetails?.isOpen !== undefined ? owner.shopDetails.isOpen : true,
        productCount: count,
      });
    }

    // Also include any shops that have products in the Product collection but weren't in shopOwners
    const seenShopIds = new Set<string>();
    for (const s of shopMap.values()) {
      if (s.id) seenShopIds.add(s.id.toLowerCase());
    }

    for (const prod of products) {
      if (!prod.shopName) continue;
      const normKey = prod.shopName.toLowerCase().trim();
      const resolvedProdShopId = (prod.shopId || `shop_${encodeURIComponent(prod.shopName)}`).toLowerCase();

      if (!shopMap.has(normKey) && !seenShopIds.has(resolvedProdShopId)) {
        seenShopIds.add(resolvedProdShopId);
        const count = products.filter(
          (p) => p.shopName && p.shopName.toLowerCase().trim() === normKey
        ).length;

        shopMap.set(normKey, {
          id: prod.shopId || `shop_${encodeURIComponent(prod.shopName)}`,
          name: prod.shopName,
          category: 'Retail & Grocery',
          rating: 4.8,
          reviewCount: 'Verified Store',
          deliveryTime: '20-30 mins',
          isFreeDelivery: true,
          image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800',
          address: 'Hyperlocal Market',
          ownerId: prod.shopId,
          isOpen: true,
          productCount: count,
        });
      }
    }

    const result = Array.from(shopMap.values());

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('API /shops GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch shops' },
      { status: 500 }
    );
  }
}

