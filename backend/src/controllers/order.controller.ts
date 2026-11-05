import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Order, IDeliveryAddressSnapshot } from '../models/Order';
import { Address } from '../models/Address';
import { AppError } from '../utils/appError';
import { sendResponse } from '../utils/apiResponse';

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

    const { items, addressId, deliveryAddress, subtotal, deliveryFee, handlingFee, totalAmount, paymentMethod } = req.body;

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
    else if (deliveryAddress && deliveryAddress.receiverName && deliveryAddress.phone && deliveryAddress.house && deliveryAddress.street) {
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

    const orderSubtotal = Number(subtotal) || items.reduce((acc, it) => acc + (Number(it.price) * Number(it.quantity)), 0);
    const orderDeliveryFee = Number(deliveryFee) !== undefined ? Number(deliveryFee) : (orderSubtotal > 199 ? 0 : 25);
    const orderHandlingFee = Number(handlingFee) || 5;
    const orderTotal = Number(totalAmount) || (orderSubtotal + orderDeliveryFee + orderHandlingFee);

    const order = await Order.create({
      user: userId,
      items,
      deliveryAddress: snapshot,
      subtotal: orderSubtotal,
      deliveryFee: orderDeliveryFee,
      handlingFee: orderHandlingFee,
      totalAmount: orderTotal,
      status: 'placed',
      paymentMethod: paymentMethod || 'Cash on Delivery',
      paymentStatus: 'pending',
      estimatedDeliveryTime: '15-25 mins',
    });

    sendResponse(res, {
      statusCode: 201,
      message: 'Order placed successfully',
      data: { order },
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

    if (req.user?.role !== 'customer' && req.user?.role !== 'admin') {
      throw new AppError('Only customers are authorized to place orders.', 403);
    }

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

    sendResponse(res, {
      statusCode: 200,
      message: 'Orders retrieved successfully',
      data: { orders },
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

    if (req.user?.role !== 'customer' && req.user?.role !== 'admin') {
      throw new AppError('Only customers are authorized to access order history.', 403);
    }

    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.user.toString() !== userId.toString() && req.user?.role !== 'admin') {
      throw new AppError('Access denied. You do not have permission to view this order.', 403);
    }

    sendResponse(res, {
      statusCode: 200,
      message: 'Order retrieved successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

