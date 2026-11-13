import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { User } from '@/models/User';
import { getUserFromRequest } from '@/lib/auth-server';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const caller = getUserFromRequest(req);
    const body = await req.json();
    const requestedStatus = body.status || 'SHOP_ACCEPTED';

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    if (caller?.id && mongoose.isValidObjectId(caller.id) && !order.shop) {
      order.shop = new mongoose.Types.ObjectId(caller.id);
    }

    if (requestedStatus === 'SHOP_ACCEPTED' || requestedStatus === 'confirmed') {
      order.shopAcceptedAt = new Date();

      // Step: Search for nearest available delivery partner who has NO active orders and is marked Ready
      const activeRiders = await User.find({
        role: 'delivery_partner',
        isActive: true,
        'deliveryDetails.isAvailable': { $ne: false },
      });

      let chosenRider = null;

      // Filter riders who have zero active in-flight orders
      for (const rider of activeRiders) {
        const inFlightCount = await Order.countDocuments({
          deliveryPartner: rider._id,
          status: { $in: ['RIDER_ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] },
        });

        if (inFlightCount === 0) {
          chosenRider = rider;
          break; // Found an idle delivery partner
        }
      }

      if (chosenRider) {
        // Assign the idle delivery partner and set status to RIDER_ASSIGNED
        order.deliveryPartner = chosenRider._id as mongoose.Types.ObjectId;
        order.status = 'RIDER_ASSIGNED';
        order.riderAssignedAt = new Date();
      } else {
        // All riders are busy or offline — set status to FINDING_RIDER
        order.status = 'FINDING_RIDER';
      }
    } else {
      order.status = requestedStatus;
    }

    await order.save();

    const populated = await Order.findById(id)
      .populate('user', 'name phone email avatar')
      .populate('shop', 'name shopDetails phone')
      .populate('deliveryPartner', 'name phone avatar deliveryDetails');

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${order.status}`,
      data: {
        order: populated || order,
      },
    });
  } catch (error: any) {
    console.error('API /orders/[id]/shop-status PATCH error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
