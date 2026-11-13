import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { User } from '@/models/User';
import { getUserFromRequest } from '@/lib/auth-server';

export async function POST(
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
    let riderId: mongoose.Types.ObjectId;

    if (caller?.id && mongoose.isValidObjectId(caller.id)) {
      riderId = new mongoose.Types.ObjectId(caller.id);
    } else {
      // Find or provision delivery partner user
      let rider = await User.findOne({ role: 'delivery_partner', isActive: true });
      if (!rider) {
        rider = await User.create({
          name: 'Quick Express Rider',
          email: 'rider@quickbasket.local',
          phone: '9876500001',
          role: 'delivery_partner',
          isActive: true,
          deliveryDetails: {
            vehicleType: 'Delivery Bike',
            vehicleNumber: 'WB-01-AB-1234',
            isAvailable: true,
          },
        });
      }
      riderId = rider._id as mongoose.Types.ObjectId;
    }

    const body = await req.json().catch(() => ({}));
    const { latitude, longitude } = body;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Update status to RIDER_ACCEPTED (Customer and Shop Owner see Delivery Partner Assigned)
    order.deliveryPartner = riderId;
    order.status = 'RIDER_ACCEPTED';
    order.riderAcceptedAt = new Date();

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      order.riderLocation = {
        latitude,
        longitude,
        heading: 0,
        accuracy: 10,
        updatedAt: new Date(),
      };
    }

    await order.save();

    const populated = await Order.findById(id)
      .populate('user', 'name phone email avatar')
      .populate('shop', 'name shopDetails phone')
      .populate('deliveryPartner', 'name phone avatar deliveryDetails');

    return NextResponse.json({
      success: true,
      message: 'Delivery accepted successfully. Rider assigned to order.',
      data: {
        order: populated || order,
      },
    });
  } catch (error: any) {
    console.error('API /delivery/orders/[id]/accept POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to accept order' },
      { status: 500 }
    );
  }
}

