import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Order, IOrder, IDeliveryAddressSnapshot, OrderStatus } from '../models/Order';
import { Address } from '../models/Address';
import { User } from '../models/User';
import { AppError } from '../utils/appError';
import { sendResponse } from '../utils/apiResponse';
import { emitOrderStatusUpdate, emitRiderAssigned } from '../services/socket.service';
import { calculateRoadRoute } from '../services/routing.service';

/**
 * Sanitizes order object based on caller role & lifecycle stage to protect rider privacy
 * and prevent fabricating rider information before RIDER_ACCEPTED.
 */
export function sanitizeOrderResponse(orderDoc: any, callerRole: string, callerUserId: string): any {
  const order = orderDoc.toObject ? orderDoc.toObject() : { ...orderDoc };

  const isCustomer = callerRole === 'customer';
  const preAcceptanceStatuses = [
    'ORDER_PLACED',
    'SHOP_ACCEPTED',
    'FINDING_RIDER',
    'RIDER_ASSIGNED',
    'placed',
    'confirmed',
    'packing',
  ];

  // If customer is viewing before rider has officially accepted:
  // Must NOT leak rider name, phone, avatar, or coordinates
  if (isCustomer && preAcceptanceStatuses.includes(order.status)) {
    order.deliveryPartner = null;
    order.riderLocation = null;
  }

  // Once delivered or cancelled, live tracking is marked inactive
  const isTerminal =
    order.status === 'DELIVERED' ||
    order.status === 'delivered' ||
    order.status === 'CANCELLED' ||
    order.status === 'cancelled';

  order.isLiveTrackingActive = !isTerminal && !preAcceptanceStatuses.includes(order.status);

  return order;
}

export const createOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    if (req.user?.role !== 'customer' && req.user?.role !== 'admin') {
      throw new AppError('Only customers are authorized to place orders.', 403);
    }

    const {
      items,
      addressId,
      deliveryAddress,
      subtotal,
      deliveryFee,
      handlingFee,
      totalAmount,
      paymentMethod,
      shopId,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('Order must contain at least one item', 400);
    }

    let snapshot: IDeliveryAddressSnapshot;

    // 1. If addressId provided, fetch address document to create immutable snapshot
    if (addressId) {
      const savedAddress = await Address.findOne({ _id: addressId, user: userId });
      if (!savedAddress) {
        throw new AppError('Selected delivery address not found', 404);
      }
      snapshot = {
        receiverName: savedAddress.receiverName,
        phone: savedAddress.phone,
        house: savedAddress.house,
        street: savedAddress.street,
        landmark: savedAddress.landmark || '',
        label: savedAddress.label,
        formattedAddress: savedAddress.formattedAddress || '',
        location: {
          type: 'Point',
          coordinates: savedAddress.location.coordinates,
        },
      };
    }
    // 2. Or if direct address snapshot was passed
    else if (
      deliveryAddress &&
      deliveryAddress.receiverName &&
      deliveryAddress.phone &&
      deliveryAddress.house &&
      deliveryAddress.street
    ) {
      snapshot = {
        receiverName: deliveryAddress.receiverName,
        phone: deliveryAddress.phone,
        house: deliveryAddress.house,
        street: deliveryAddress.street,
        landmark: deliveryAddress.landmark || '',
        label: deliveryAddress.label || 'Home',
        formattedAddress: deliveryAddress.formattedAddress || '',
        location: {
          type: 'Point',
          coordinates: Array.isArray(deliveryAddress.location?.coordinates)
            ? deliveryAddress.location.coordinates
            : [deliveryAddress.longitude || 77.209, deliveryAddress.latitude || 28.6139],
        },
      };
    } else {
      throw new AppError('Valid delivery address is required to place an order', 400);
    }

    // Associate with verified shop owner if present
    let assignedShopId = shopId;
    if (!assignedShopId) {
      const defaultShop = await User.findOne({ role: 'shop_owner', isActive: true });
      if (defaultShop) {
        assignedShopId = defaultShop._id;
      }
    }

    const orderSubtotal =
      Number(subtotal) ||
      items.reduce((acc, it) => acc + Number(it.price) * Number(it.quantity), 0);
    const orderDeliveryFee =
      Number(deliveryFee) !== undefined ? Number(deliveryFee) : orderSubtotal > 199 ? 0 : 25;
    const orderHandlingFee = Number(handlingFee) || 5;
    const orderTotal = Number(totalAmount) || orderSubtotal + orderDeliveryFee + orderHandlingFee;

    const order = await Order.create({
      user: userId,
      shop: assignedShopId,
      items,
      deliveryAddress: snapshot,
      subtotal: orderSubtotal,
      deliveryFee: orderDeliveryFee,
      handlingFee: orderHandlingFee,
      totalAmount: orderTotal,
      status: 'ORDER_PLACED',
      paymentMethod: paymentMethod || 'Cash on Delivery',
      paymentStatus: 'pending',
      estimatedDeliveryTime: '15-25 mins',
      placedAt: new Date(),
    });

    emitOrderStatusUpdate(order._id.toString(), 'ORDER_PLACED', {
      orderId: order._id,
      status: 'ORDER_PLACED',
    });

    sendResponse(res, {
      statusCode: 201,
      message: 'Order placed successfully',
      data: {
        order: sanitizeOrderResponse(order, req.user?.role || 'customer', userId.toString()),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const callerRole = req.user?.role || 'customer';

    let filter: Record<string, any> = {};
    if (callerRole === 'customer') {
      filter = { user: userId };
    } else if (callerRole === 'shop_owner') {
      filter = { shop: userId };
    } else if (callerRole === 'delivery_partner') {
      filter = { deliveryPartner: userId };
    }

    const orders = await Order.find(filter)
      .populate('deliveryPartner', 'name phone avatar deliveryDetails')
      .populate('shop', 'name phone shopDetails')
      .sort({ createdAt: -1 });

    const sanitized = orders.map((ord) =>
      sanitizeOrderResponse(ord, callerRole, userId.toString())
    );

    sendResponse(res, {
      statusCode: 200,
      message: 'Orders retrieved successfully',
      data: { orders: sanitized },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('deliveryPartner', 'name phone avatar deliveryDetails')
      .populate('shop', 'name phone shopDetails');

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const callerRole = req.user?.role || 'customer';
    const isOwner = order.user.toString() === userId.toString();
    const isRider = order.deliveryPartner && order.deliveryPartner.toString() === userId.toString();
    const isShop = order.shop && order.shop.toString() === userId.toString();
    const isAdmin = callerRole === 'admin';

    if (!isOwner && !isRider && !isShop && !isAdmin) {
      throw new AppError('Access denied. You do not have permission to view this order.', 403);
    }

    const sanitized = sanitizeOrderResponse(order, callerRole, userId.toString());

    sendResponse(res, {
      statusCode: 200,
      message: 'Order retrieved successfully',
      data: { order: sanitized },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculates road route and true travel distance / ETA between rider and destination
 */
export const getOrderRoute = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const callerRole = req.user?.role || 'customer';
    const isOwner = order.user.toString() === userId.toString();
    const isRider = order.deliveryPartner && order.deliveryPartner.toString() === userId.toString();
    const isShop = order.shop && order.shop.toString() === userId.toString();
    const isAdmin = callerRole === 'admin';

    if (!isOwner && !isRider && !isShop && !isAdmin) {
      throw new AppError('Access denied. You do not have permission to view this route.', 403);
    }

    const [destLng, destLat] = order.deliveryAddress.location.coordinates;

    // Use current rider GPS coordinates if available; else fallback to store offset
    let startLng: number;
    let startLat: number;

    if (order.riderLocation && order.riderLocation.latitude && order.riderLocation.longitude) {
      startLng = order.riderLocation.longitude;
      startLat = order.riderLocation.latitude;
    } else {
      // Nearby pickup position ~1.2 km away
      startLng = destLng - 0.012;
      startLat = destLat + 0.009;
    }

    const route = await calculateRoadRoute(startLng, startLat, destLng, destLat);

    // Save computed distance and ETA on order document
    order.routeDistanceKm = route.distanceKm;
    order.routeEtaMinutes = route.durationMinutes;
    await order.save();

    sendResponse(res, {
      statusCode: 200,
      message: 'Route calculated successfully',
      data: {
        route,
        destination: {
          longitude: destLng,
          latitude: destLat,
          address: `${order.deliveryAddress.house}, ${order.deliveryAddress.street}`,
        },
        rider: {
          longitude: startLng,
          latitude: startLat,
          heading: order.riderLocation?.heading || 0,
          updatedAt: order.riderLocation?.updatedAt || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Shop Owner updates order status (SHOP_ACCEPTED, FINDING_RIDER)
 */
export const updateShopOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    if (req.user?.role !== 'shop_owner' && req.user?.role !== 'admin') {
      throw new AppError('Only shop owners or admins can update store order status.', 403);
    }

    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.shop && order.shop.toString() !== userId.toString() && req.user?.role !== 'admin') {
      throw new AppError('You are not authorized to update orders for another shop.', 403);
    }

    if (status === 'SHOP_ACCEPTED' || status === 'confirmed' || status === 'packing') {
      order.status = 'SHOP_ACCEPTED';
      order.shopAcceptedAt = new Date();

      // Trigger finding rider & assign an approved available delivery partner
      order.status = 'FINDING_RIDER';

      const availableRider = await User.findOne({
        role: 'delivery_partner',
        isActive: true,
      });

      if (availableRider) {
        order.deliveryPartner = availableRider._id as any;
        order.status = 'RIDER_ASSIGNED';
        order.riderAssignedAt = new Date();

        emitRiderAssigned(order._id.toString(), {
          riderId: availableRider._id,
          name: availableRider.name,
        });
      }

      await order.save();

      emitOrderStatusUpdate(order._id.toString(), order.status, {
        orderId: order._id,
        status: order.status,
      });

      sendResponse(res, {
        statusCode: 200,
        message: 'Order accepted by store and delivery partner search initiated',
        data: {
          order: sanitizeOrderResponse(order, req.user?.role || 'shop_owner', userId.toString()),
        },
      });
      return;
    }

    if (status === 'CANCELLED' || status === 'cancelled') {
      order.status = 'CANCELLED';
      order.cancelledAt = new Date();
      await order.save();

      emitOrderStatusUpdate(order._id.toString(), 'CANCELLED');

      sendResponse(res, {
        statusCode: 200,
        message: 'Order cancelled',
        data: { order },
      });
      return;
    }

    throw new AppError('Invalid shop order status transition requested', 400);
  } catch (error) {
    next(error);
  }
};
