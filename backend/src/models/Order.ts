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

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'packing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface IOrder extends Document {
  user: Types.ObjectId;
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
      enum: ['placed', 'confirmed', 'packing', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'placed',
      index: true,
    },
    paymentMethod: { type: String, default: 'Cash on Delivery' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    estimatedDeliveryTime: { type: String, default: '15-25 mins' },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ user: 1, createdAt: -1 });

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

