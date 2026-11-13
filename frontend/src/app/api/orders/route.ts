import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { User } from '@/models/User';
import { Product } from '@/models/Product';
import { getUserFromRequest } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      items,
      deliveryAddress,
      subtotal,
      deliveryFee,
      handlingFee,
      totalAmount,
      paymentMethod,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    if (!deliveryAddress || !deliveryAddress.receiverName || !deliveryAddress.phone) {
      return NextResponse.json(
        { success: false, message: 'Valid delivery address with name and phone is required' },
        { status: 400 }
      );
    }

    // 1. Identify or provision customer user
    const caller = getUserFromRequest(req);
    let customerUserId: mongoose.Types.ObjectId;

    if (caller?.id && mongoose.isValidObjectId(caller.id)) {
      customerUserId = new mongoose.Types.ObjectId(caller.id);
    } else {
      // Find or create customer account for guest / phone
      const phone = deliveryAddress.phone.trim();
      let customerUser = await User.findOne({ phone });
      if (!customerUser) {
        const guestEmail = `guest_${phone.replace(/\D/g, '') || Date.now()}@quickbasket.local`;
        customerUser = await User.create({
          name: deliveryAddress.receiverName || 'Customer',
          email: guestEmail,
          phone: phone || '9876543210',
          role: 'customer',
          isActive: true,
        });
      }
      customerUserId = customerUser._id as mongoose.Types.ObjectId;
    }

    // 2. Resolve shop information from items or products in MongoDB
    let assignedShopOwnerId: mongoose.Types.ObjectId | null = null;
    let assignedShopName = '';

    // Check items for shopId/shopName or look up in DB
    const enrichedItems = [];
    for (const it of items) {
      let itShopId = it.shopId || '';
      let itShopName = it.shopName || '';

      if ((!itShopId || !itShopName) && it.productId && mongoose.isValidObjectId(it.productId)) {
        try {
          const dbProd = await Product.findById(it.productId);
          if (dbProd) {
            itShopId = dbProd.shopId || itShopId;
            itShopName = dbProd.shopName || itShopName;
          }
        } catch {
          // Ignore lookup failure
        }
      }

      if (!assignedShopName && itShopName) {
        assignedShopName = itShopName;
      }

      if (!assignedShopOwnerId && itShopId && mongoose.isValidObjectId(itShopId)) {
        assignedShopOwnerId = new mongoose.Types.ObjectId(itShopId);
      }

      enrichedItems.push({
        productId: it.productId || it.id || String(Date.now()),
        name: it.name,
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        image: it.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
        unit: it.unit || '1 unit',
        category: it.category || 'General',
        shopId: itShopId,
        shopName: itShopName,
      });
    }

    // If shop owner not resolved from item shopId, resolve by shopName
    if (!assignedShopOwnerId && assignedShopName) {
      const shopByUser = await User.findOne({
        role: 'shop_owner',
        'shopDetails.shopName': assignedShopName,
      });
      if (shopByUser) {
        assignedShopOwnerId = shopByUser._id as mongoose.Types.ObjectId;
      }
    }

    // Fallback: Assign to active shop owner in database so it is never orphaned
    if (!assignedShopOwnerId) {
      const defaultShopOwner = await User.findOne({ role: 'shop_owner', isActive: true });
      if (defaultShopOwner) {
        assignedShopOwnerId = defaultShopOwner._id as mongoose.Types.ObjectId;
        if (!assignedShopName) {
          assignedShopName = defaultShopOwner.shopDetails?.shopName || 'Neighborhood Store';
        }
      }
    }

    const calcSubtotal =
      Number(subtotal) ||
      enrichedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const calcDeliveryFee =
      deliveryFee !== undefined ? Number(deliveryFee) : calcSubtotal > 199 ? 0 : 25;
    const calcHandlingFee = handlingFee !== undefined ? Number(handlingFee) : 5;
    const calcTotal =
      Number(totalAmount) || calcSubtotal + calcDeliveryFee + calcHandlingFee;

    const coordinates = Array.isArray(deliveryAddress.location?.coordinates)
      ? deliveryAddress.location.coordinates
      : [
          deliveryAddress.longitude || deliveryAddress.location?.lng || 77.209,
          deliveryAddress.latitude || deliveryAddress.location?.lat || 28.6139,
        ];

    const newOrder: any = await Order.create({
      user: customerUserId,
      shop: assignedShopOwnerId || undefined,
      shopName: assignedShopName,
      items: enrichedItems,
      deliveryAddress: {
        receiverName: deliveryAddress.receiverName,
        phone: deliveryAddress.phone,
        house: deliveryAddress.house || '',
        street: deliveryAddress.street || '',
        landmark: deliveryAddress.landmark || '',
        label: deliveryAddress.label || 'Home',
        formattedAddress: deliveryAddress.formattedAddress || '',
        location: {
          type: 'Point',
          coordinates,
        },
      },
      subtotal: calcSubtotal,
      deliveryFee: calcDeliveryFee,
      handlingFee: calcHandlingFee,
      totalAmount: calcTotal,
      status: 'ORDER_PLACED',
      paymentMethod: paymentMethod || 'Cash on Delivery',
      paymentStatus: 'pending',
      estimatedDeliveryTime: '15-25 mins',
      placedAt: new Date(),
    });

    const populatedOrder = await Order.findById(newOrder._id)
      .populate('user', 'name phone email avatar')
      .populate('shop', 'name shopDetails phone')
      .populate('deliveryPartner', 'name phone avatar');

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      data: {
        order: populatedOrder || newOrder,
      },
    });
  } catch (error: any) {
    console.error('API /orders POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to place order' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const caller = getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const queryOrderId = searchParams.get('orderId');

    if (queryOrderId && mongoose.isValidObjectId(queryOrderId)) {
      const singleOrder = await Order.findById(queryOrderId)
        .populate('user', 'name phone email avatar')
        .populate('shop', 'name shopDetails phone')
        .populate('deliveryPartner', 'name phone avatar');

      return NextResponse.json({
        success: true,
        data: { orders: singleOrder ? [singleOrder] : [] },
      });
    }

    if (!caller) {
      // If unauthenticated guest request with no specific ID, return empty list
      return NextResponse.json({
        success: true,
        data: { orders: [] },
      });
    }

    const callerRole = caller.role;
    const userId = caller.id;

    let filter: Record<string, any> = {};

    if (callerRole === 'customer') {
      filter = { user: userId };
    } else if (callerRole === 'shop_owner') {
      // Find shop details of logged-in merchant
      let shopName = '';
      if (mongoose.isValidObjectId(userId)) {
        const shopUser = await User.findById(userId);
        shopName = shopUser?.shopDetails?.shopName || '';
      }

      // Match orders directly assigned by shop ID, shopName, item shop tags, OR unassigned fallback
      filter = {
        $or: [
          { shop: userId },
          ...(shopName ? [{ shopName }] : []),
          { 'items.shopId': userId },
          ...(shopName ? [{ 'items.shopName': shopName }] : []),
          { shop: null },
          { shop: { $exists: false } },
        ],
      };
    } else if (callerRole === 'delivery_partner') {
      filter = {
        $or: [
          { deliveryPartner: userId },
          { status: { $in: ['SHOP_ACCEPTED', 'FINDING_RIDER', 'RIDER_ASSIGNED'] } },
        ],
      };
    } else if (callerRole === 'admin') {
      filter = {};
    }

    const orders = await Order.find(filter)
      .populate('user', 'name phone email avatar')
      .populate('shop', 'name shopDetails phone')
      .populate('deliveryPartner', 'name phone avatar')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: {
        orders,
      },
    });
  } catch (error: any) {
    console.error('API /orders GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
