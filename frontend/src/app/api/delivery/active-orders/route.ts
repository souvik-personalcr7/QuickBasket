import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const caller = getUserFromRequest(req);
    const userId = caller?.id;

    // Filter: In-flight orders assigned to this rider OR unassigned/dispatching orders
    let filter: Record<string, any> = {};

    if (userId && mongoose.isValidObjectId(userId)) {
      filter = {
        $or: [
          {
            deliveryPartner: new mongoose.Types.ObjectId(userId),
            status: { $in: ['RIDER_ASSIGNED', 'RIDER_ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] },
          },
          {
            status: { $in: ['FINDING_RIDER', 'SHOP_ACCEPTED', 'RIDER_ASSIGNED', 'confirmed', 'packing'] },
            $or: [
              { deliveryPartner: null },
              { deliveryPartner: { $exists: false } },
              { deliveryPartner: new mongoose.Types.ObjectId(userId) },
            ],
          },
        ],
      };
    } else {
      // If demo / test delivery partner, return all active pending and in-transit orders
      filter = {
        status: {
          $in: [
            'ORDER_PLACED',
            'SHOP_ACCEPTED',
            'FINDING_RIDER',
            'RIDER_ASSIGNED',
            'RIDER_ACCEPTED',
            'PICKED_UP',
            'OUT_FOR_DELIVERY',
          ],
        },
      };
    }

    const orders = await Order.find(filter)
      .populate('shop', 'name phone shopDetails address')
      .populate('user', 'name phone email avatar')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      message: 'Active delivery dispatches retrieved',
      data: { orders },
    });
  } catch (error: any) {
    console.error('API /delivery/active-orders GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch active dispatches' },
      { status: 500 }
    );
  }
}

