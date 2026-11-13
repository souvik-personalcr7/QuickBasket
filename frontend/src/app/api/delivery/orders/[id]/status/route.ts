import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';

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

    const body = await req.json();
    const { status, latitude, longitude } = body;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      order.riderLocation = {
        latitude,
        longitude,
        heading: 0,
        accuracy: 10,
        updatedAt: new Date(),
      };
    }

    if (status === 'PICKED_UP') {
      order.status = 'PICKED_UP';
      order.pickedUpAt = new Date();
    } else if (status === 'OUT_FOR_DELIVERY') {
      order.status = 'OUT_FOR_DELIVERY';
      if (!order.pickedUpAt) order.pickedUpAt = new Date();
    } else if (status === 'DELIVERED') {
      order.status = 'DELIVERED';
      order.deliveredAt = new Date();
      order.paymentStatus = 'paid';
    } else if (status) {
      order.status = status;
    }

    await order.save();

    const populated = await Order.findById(id)
      .populate('user', 'name phone email avatar')
      .populate('shop', 'name shopDetails phone')
      .populate('deliveryPartner', 'name phone avatar deliveryDetails');

    return NextResponse.json({
      success: true,
      message: `Delivery status updated to ${order.status}`,
      data: {
        order: populated || order,
      },
    });
  } catch (error: any) {
    console.error('API /delivery/orders/[id]/status POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update delivery status' },
      { status: 500 }
    );
  }
}

