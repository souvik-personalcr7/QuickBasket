import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';

export async function GET(
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

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    const customerCoords = order.deliveryAddress?.location?.coordinates || [77.209, 28.6139];
    const shopCoords = [customerCoords[0] - 0.012, customerCoords[1] - 0.008];
    const riderCoords = order.riderLocation?.longitude
      ? [order.riderLocation.longitude, order.riderLocation.latitude]
      : [customerCoords[0] - 0.006, customerCoords[1] - 0.004];

    // Build route coordinates connecting shop -> rider -> customer
    const coordinates: [number, number][] = [
      [shopCoords[0], shopCoords[1]],
      [riderCoords[0], riderCoords[1]],
      [customerCoords[0], customerCoords[1]],
    ];

    return NextResponse.json({
      success: true,
      data: {
        route: {
          coordinates,
          distanceKm: order.routeDistanceKm || 2.4,
          durationMinutes: order.routeEtaMinutes || 18,
        },
      },
    });
  } catch (error: any) {
    console.error('API /orders/[id]/route GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch order route' },
      { status: 500 }
    );
  }
}

