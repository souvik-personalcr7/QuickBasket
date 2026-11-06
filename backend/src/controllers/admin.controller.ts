import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Order } from '../models/Order';
import { AppError } from '../utils/appError';
import { sendResponse } from '../utils/apiResponse';

export const getActiveDeliveries = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      throw new AppError('Only administrators are authorized to access fleet monitoring.', 403);
    }

    const activeOrders = await Order.find({
      status: { $nin: ['DELIVERED', 'delivered', 'CANCELLED', 'cancelled'] },
    })
      .populate('deliveryPartner', 'name phone avatar deliveryDetails')
      .populate('user', 'name phone')
      .populate('shop', 'name phone shopDetails')
      .sort({ createdAt: -1 });

    sendResponse(res, {
      statusCode: 200,
      message: 'Active fleet deliveries retrieved',
      data: {
        count: activeOrders.length,
        deliveries: activeOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

