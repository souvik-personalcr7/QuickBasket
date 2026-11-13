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
    const { latitude, longitude, heading, accuracy } = body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { success: false, message: 'Valid latitude and longitude numbers are required' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    order.riderLocation = {
      latitude,
      longitude,
      heading: typeof heading === 'number' ? heading : 0,
      accuracy: typeof accuracy === 'number' ? accuracy : 10,
      updatedAt: new Date(),
    };

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Rider GPS location updated successfully',
      data: {
        riderLocation: order.riderLocation,
      },
    });
  } catch (error: any) {
    console.error('API /delivery/orders/[id]/location POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update location' },
      { status: 500 }
    );
  }
}

