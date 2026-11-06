import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { IGeoPoint } from './Address';

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  unit?: string;
  category?: string;
}

export interface IDeliveryAddressSnapshot {
  receiverName: string;
  phone: string;
  house: string;
  street: string;
  landmark?: string;
  label: string;
  formattedAddress?: string;
  location: IGeoPoint;
}

export type CanonicalOrderStatus =
  | 'ORDER_PLACED'
  | 'SHOP_ACCEPTED'
  | 'FINDING_RIDER'
  | 'RIDER_ASSIGNED'
  | 'RIDER_ACCEPTED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type OrderStatus =
  | CanonicalOrderStatus
  | 'placed'
  | 'confirmed'
  | 'packing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface IRiderLiveLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  accuracy?: number;
  updatedAt: Date;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  shop?: Types.ObjectId;
  deliveryPartner?: Types.ObjectId;
  items: IOrderItem[];
  deliveryAddress: IDeliveryAddressSnapshot;
  subtotal: number;
  deliveryFee: number;
  handlingFee: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  estimatedDeliveryTime?: string;
  riderLocation?: IRiderLiveLocation;
  placedAt: Date;
  shopAcceptedAt?: Date;
  riderAssignedAt?: Date;
  riderAcceptedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  routeDistanceKm?: number;
  routeEtaMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    deliveryPartner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    items: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String, required: true },
        unit: { type: String, default: '' },
        category: { type: String, default: '' },
      },
    ],
    deliveryAddress: {
      receiverName: { type: String, required: true },
      phone: { type: String, required: true },
      house: { type: String, required: true },
      street: { type: String, required: true },
      landmark: { type: String, default: '' },
      label: { type: String, default: 'Home' },
      formattedAddress: { type: String, default: '' },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true,
        },
      },
    },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true, default: 0 },
    handlingFee: { type: Number, required: true, default: 5 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        'ORDER_PLACED',
        'SHOP_ACCEPTED',
        'FINDING_RIDER',
        'RIDER_ASSIGNED',
        'RIDER_ACCEPTED',
        'PICKED_UP',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'placed',
        'confirmed',
        'packing',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ],
      default: 'ORDER_PLACED',
      index: true,
    },
    paymentMethod: { type: String, default: 'Cash on Delivery' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    estimatedDeliveryTime: { type: String, default: '15-25 mins' },
    riderLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      heading: { type: Number },
      accuracy: { type: Number },
      updatedAt: { type: Date },
    },
    placedAt: { type: Date, default: Date.now },
    shopAcceptedAt: { type: Date },
    riderAssignedAt: { type: Date },
    riderAcceptedAt: { type: Date },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    routeDistanceKm: { type: Number },
    routeEtaMinutes: { type: Number },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ deliveryPartner: 1, status: 1 });
OrderSchema.index({ shop: 1, status: 1 });

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
