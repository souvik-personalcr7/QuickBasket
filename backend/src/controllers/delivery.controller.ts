import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Order, IOrder } from '../models/Order';
import { User } from '../models/User';
import { AppError } from '../utils/appError';
import { sendResponse } from '../utils/apiResponse';
import {
  emitOrderStatusUpdate,
  emitRiderDeliveryAccepted,
} from '../services/socket.service';

/**
 * Returns active orders assigned to or available for the authenticated delivery partner
 */
export const getDeliveryActiveOrders = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    if (req.user?.role !== 'delivery_partner' && req.user?.role !== 'admin') {
      throw new AppError('Only delivery partners can access active dispatches.', 403);
    }

    // Active in-flight orders for this rider OR available dispatch offers waiting for rider pickup
    const orders = await Order.find({
      $or: [
        {
          deliveryPartner: userId,
          status: { $in: ['RIDER_ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] },
        },
        {
          status: { $in: ['SHOP_ACCEPTED', 'FINDING_RIDER', 'RIDER_ASSIGNED', 'confirmed', 'packing'] },
        },
      ],
    })
      .populate('shop', 'name phone shopDetails address')
      .populate('user', 'name phone')
      .sort({ createdAt: -1 });

    sendResponse(res, {
      statusCode: 200,
      message: 'Active delivery dispatches retrieved',
      data: { orders },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delivery partner accepts an assigned or available order
 */
export const acceptDeliveryOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    if (req.user?.role !== 'delivery_partner' && req.user?.role !== 'admin') {
      throw new AppError('Only delivery partners can accept orders.', 403);
    }

    const { id } = req.params;
    const { latitude, longitude } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const acceptableStatuses = ['FINDING_RIDER', 'RIDER_ASSIGNED', 'SHOP_ACCEPTED', 'placed', 'confirmed', 'packing'];
    if (!acceptableStatuses.includes(order.status) && order.status !== 'ORDER_PLACED') {
      throw new AppError(`Order is already in status: ${order.status}`, 400);
    }

    order.deliveryPartner = userId as any;
    order.status = 'OUT_FOR_DELIVERY';
    order.riderAcceptedAt = new Date();
    order.pickedUpAt = new Date();

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      order.riderLocation = {
        latitude,
        longitude,
        updatedAt: new Date(),
      };
    }

    await order.save();

    // Broadcast rider acceptance to customer and room
    emitRiderDeliveryAccepted(order._id.toString(), {
      id: userId.toString(),
      name: req.user?.name || 'Assigned Partner',
      phone: req.user?.phone || '',
      avatar: req.user?.avatar,
      vehicleType: req.user?.deliveryDetails?.vehicleType || 'Delivery Bike',
      vehicleNumber: req.user?.deliveryDetails?.vehicleNumber || '',
    });

    emitOrderStatusUpdate(order._id.toString(), 'OUT_FOR_DELIVERY', {
      orderId: order._id,
      status: 'OUT_FOR_DELIVERY',
      riderLocation: order.riderLocation,
      deliveryPartner: {
        name: req.user?.name,
        phone: req.user?.phone,
        avatar: req.user?.avatar,
        deliveryDetails: req.user?.deliveryDetails,
      },
    });

    sendResponse(res, {
      statusCode: 200,
      message: 'Delivery accepted successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delivery partner updates status (PICKED_UP, OUT_FOR_DELIVERY, DELIVERED)
 */
export const updateDeliveryStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    if (req.user?.role !== 'delivery_partner' && req.user?.role !== 'admin') {
      throw new AppError('Only delivery partners can update delivery status.', 403);
    }

    const { id } = req.params;
    const { status, latitude, longitude } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.deliveryPartner?.toString() !== userId.toString() && req.user?.role !== 'admin') {
      throw new AppError('You are not the assigned delivery partner for this order.', 403);
    }

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      order.riderLocation = {
        latitude,
        longitude,
        updatedAt: new Date(),
      };
    }

    if (status === 'PICKED_UP' || status === 'OUT_FOR_DELIVERY') {
      order.status = status;
      if (status === 'PICKED_UP') {
        order.pickedUpAt = new Date();
      }
      await order.save();

      emitOrderStatusUpdate(order._id.toString(), status, {
        orderId: order._id,
        status,
        riderLocation: order.riderLocation,
      });

      sendResponse(res, {
        statusCode: 200,
        message: `Order status updated to ${status}`,
        data: { order },
      });
      return;
    }

    if (status === 'DELIVERED') {
      order.status = 'DELIVERED';
      order.deliveredAt = new Date();
      order.paymentStatus = 'paid';
      await order.save();

      emitOrderStatusUpdate(order._id.toString(), 'DELIVERED', {
        orderId: order._id,
        status: 'DELIVERED',
      });

      sendResponse(res, {
        statusCode: 200,
        message: 'Order marked as DELIVERED',
        data: { order },
      });
      return;
    }

    throw new AppError('Invalid delivery status update', 400);
  } catch (error) {
    next(error);
  }
};

/**
 * REST Fallback for Rider GPS updates
 */
export const updateRiderGpsLocation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    if (req.user?.role !== 'delivery_partner' && req.user?.role !== 'admin') {
      throw new AppError('Only delivery partners can update location.', 403);
    }

    const { id } = req.params;
    const { latitude, longitude, heading, accuracy } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new AppError('Valid latitude and longitude are required', 400);
    }

    const order = await Order.findById(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.deliveryPartner?.toString() !== userId.toString() && req.user?.role !== 'admin') {
      throw new AppError('You are not the assigned delivery partner for this order.', 403);
    }

    order.riderLocation = {
      latitude,
      longitude,
      heading: heading || 0,
      accuracy: accuracy || 0,
      updatedAt: new Date(),
    };

    if (order.status === 'PICKED_UP') {
      order.status = 'OUT_FOR_DELIVERY';
    }

    await order.save();

    emitOrderStatusUpdate(order._id.toString(), order.status, {
      riderLocation: order.riderLocation,
    });

    sendResponse(res, {
      statusCode: 200,
      message: 'Location updated',
      data: { location: order.riderLocation },
    });
  } catch (error) {
    next(error);
  }
};

