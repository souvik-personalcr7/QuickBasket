import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, IUser, UserRole } from '../models/User';
import { Order, IOrder } from '../models/Order';
import { JwtPayload } from '../middleware/auth.middleware';

let ioInstance: SocketIOServer | null = null;

export interface AuthenticatedSocketUser {
  id: string;
  role: UserRole;
  email: string;
  name?: string;
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    if (!value) return;
    list[name] = decodeURIComponent(value);
  });

  return list;
}

export function initSocketService(io: SocketIOServer): void {
  ioInstance = io;

  // Socket Authentication Middleware
  io.use(async (socket: Socket, next) => {
    try {
      let token: string | undefined;

      // 1. Auth payload or handshake auth
      if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }
      // 2. Query param
      else if (socket.handshake.query && socket.handshake.query.token) {
        token = socket.handshake.query.token as string;
      }
      // 3. Authorization header
      else if (
        socket.handshake.headers.authorization &&
        socket.handshake.headers.authorization.startsWith('Bearer ')
      ) {
        token = socket.handshake.headers.authorization.split(' ')[1];
      }
      // 4. HTTP Cookie
      else if (socket.handshake.headers.cookie) {
        const cookies = parseCookies(socket.handshake.headers.cookie);
        token = cookies['token'] || cookies['accessToken'];
      }

      if (!token) {
        // Allow unauthenticated connection only with guest marker, but block private rooms
        socket.data.isGuest = true;
        return next();
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      const user = await User.findById(decoded.id).select('name email role isActive deliveryDetails');

      if (!user || !user.isActive) {
        socket.data.isGuest = true;
        return next();
      }

      socket.data.user = {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        name: user.name,
      } as AuthenticatedSocketUser;
      socket.data.isGuest = false;

      next();
    } catch (err) {
      // In case token is expired/invalid, mark as guest rather than abruptly crashing handshake
      socket.data.isGuest = true;
      next();
    }
  });

  // Client Connection Handler
  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as AuthenticatedSocketUser | undefined;

    // Join Admin Monitoring Room if Admin
    if (user && user.role === 'admin') {
      socket.join('admin:deliveries');
    }

    // Join Order-Specific Room with Authorization
    socket.on('join_order_room', async (orderId: string, callback?: (res: any) => void) => {
      try {
        if (!orderId || typeof orderId !== 'string') {
          if (callback) callback({ success: false, message: 'Invalid order ID' });
          return;
        }

        const order = await Order.findById(orderId);
        if (!order) {
          if (callback) callback({ success: false, message: 'Order not found' });
          return;
        }

        // Authorization check: Customer owner, Assigned rider, Shop owner, or Admin
        const userId = user?.id;
        const isAdmin = user?.role === 'admin';
        const isCustomerOwner = userId && order.user?.toString() === userId;
        const isAssignedRider = userId && order.deliveryPartner?.toString() === userId;
        const isShopOwner = userId && order.shop?.toString() === userId;

        // If guest or unauthorized
        if (!isAdmin && !isCustomerOwner && !isAssignedRider && !isShopOwner) {
          socket.emit('error:unauthorized', {
            message: 'You are not authorized to track this delivery.',
          });
          if (callback) callback({ success: false, message: 'Unauthorized' });
          return;
        }

        const roomName = `order:${orderId}`;
        socket.join(roomName);

        if (callback) {
          callback({
            success: true,
            orderId,
            status: order.status,
            riderLocation:
              order.status !== 'ORDER_PLACED' &&
              order.status !== 'SHOP_ACCEPTED' &&
              order.status !== 'FINDING_RIDER' &&
              order.status !== 'RIDER_ASSIGNED'
                ? order.riderLocation
                : undefined,
          });
        }
      } catch (err) {
        if (callback) callback({ success: false, message: 'Failed to join room' });
      }
    });

    // Rider Live Location Streaming
    socket.on(
      'rider:location:update',
      async (
        payload: {
          orderId: string;
          latitude: number;
          longitude: number;
          heading?: number;
          accuracy?: number;
          timestamp?: number;
        },
        callback?: (res: any) => void
      ) => {
        try {
          if (!user || user.role !== 'delivery_partner') {
            socket.emit('error:unauthorized', {
              message: 'Only authenticated delivery partners can broadcast live location.',
            });
            if (callback) callback({ success: false, message: 'Unauthorized' });
            return;
          }

          const { orderId, latitude, longitude, heading, accuracy } = payload;
          if (!orderId || typeof latitude !== 'number' || typeof longitude !== 'number') {
            if (callback) callback({ success: false, message: 'Invalid coordinates' });
            return;
          }

          // Validate active order and assignment
          const order = await Order.findById(orderId);
          if (!order) {
            if (callback) callback({ success: false, message: 'Order not found' });
            return;
          }

          if (order.deliveryPartner?.toString() !== user.id) {
            socket.emit('error:unauthorized', {
              message: 'You are not the assigned delivery partner for this order.',
            });
            if (callback) callback({ success: false, message: 'Forbidden' });
            return;
          }

          // Must be an active in-flight delivery
          const activeStatuses = [
            'RIDER_ACCEPTED',
            'PICKED_UP',
            'OUT_FOR_DELIVERY',
            'out_for_delivery',
          ];
          if (!activeStatuses.includes(order.status)) {
            if (callback)
              callback({ success: false, message: 'Order is not in active delivery state' });
            return;
          }

          const locationData = {
            latitude,
            longitude,
            heading: heading || 0,
            accuracy: accuracy || 0,
            updatedAt: new Date(),
          };

          // If rider was PICKED_UP and has started moving, advance to OUT_FOR_DELIVERY
          if (order.status === 'PICKED_UP') {
            order.status = 'OUT_FOR_DELIVERY';
          }

          order.riderLocation = locationData;
          await order.save();

          // Broadcast sanitized live position to customer and admin
          const broadcastPayload = {
            orderId,
            latitude,
            longitude,
            heading: heading || 0,
            accuracy: accuracy || 0,
            updatedAt: locationData.updatedAt.toISOString(),
            status: order.status,
          };

          io.to(`order:${orderId}`).emit('customer:rider:location', broadcastPayload);
          io.to('admin:deliveries').emit('admin:rider:location', broadcastPayload);

          if (callback) callback({ success: true, timestamp: Date.now() });
        } catch (err) {
          if (callback) callback({ success: false, message: 'Server error updating location' });
        }
      }
    );

    socket.on('disconnect', () => {
      // Clean up
    });
  });
}

// Global broadcast helpers
export function emitOrderStatusUpdate(
  orderId: string,
  status: string,
  extraData?: Record<string, any>
): void {
  if (!ioInstance) return;

  const payload = {
    orderId,
    status,
    timestamp: new Date().toISOString(),
    ...extraData,
  };

  ioInstance.emit('order:status:updated', payload);
  ioInstance.to(`order:${orderId}`).emit('order:status:updated', payload);
  ioInstance.to('admin:deliveries').emit('order:status:updated', payload);
}

export function emitRiderAssigned(
  orderId: string,
  rider: {
    riderId: any;
    name: string;
  }
): void {
  if (!ioInstance) return;

  const payload = {
    orderId,
    status: 'RIDER_ASSIGNED',
    riderId: rider.riderId,
    timestamp: new Date().toISOString(),
  };

  ioInstance.emit('rider:assigned', payload);
  ioInstance.emit('order:status:updated', payload);
  ioInstance.to(`order:${orderId}`).emit('rider:assigned', payload);
  ioInstance.to(`order:${orderId}`).emit('order:status:updated', payload);
  ioInstance.to('admin:deliveries').emit('order:status:updated', payload);
}

export function emitRiderDeliveryAccepted(
  orderId: string,
  rider: {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
    vehicleType?: string;
    vehicleNumber?: string;
  }
): void {
  if (!ioInstance) return;

  const payload = {
    orderId,
    status: 'OUT_FOR_DELIVERY',
    rider: {
      name: rider.name,
      phone: rider.phone,
      avatar: rider.avatar || '',
      vehicleType: rider.vehicleType || 'Delivery Bike',
      vehicleNumber: rider.vehicleNumber || '',
    },
    timestamp: new Date().toISOString(),
  };

  ioInstance.emit('rider:delivery:accepted', payload);
  ioInstance.emit('order:status:updated', payload);
  ioInstance.to(`order:${orderId}`).emit('rider:delivery:accepted', payload);
  ioInstance.to(`order:${orderId}`).emit('order:status:updated', payload);
  ioInstance.to('admin:deliveries').emit('order:status:updated', payload);
}
