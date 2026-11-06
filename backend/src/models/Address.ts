import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type AddressLabel = 'Home' | 'Work' | 'Other';

export interface IGeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IAddress extends Document {
  user: Types.ObjectId;
  shopName?: string;
  receiverName: string;
  phone: string;
  house: string;
  street: string;
  landmark?: string;
  label: AddressLabel;
  location: IGeoPoint;
  formattedAddress?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    shopName: {
      type: String,
      trim: true,
      maxlength: [100, 'Shop name cannot exceed 100 characters'],
      default: '',
    },
    receiverName: {
      type: String,
      required: [true, 'Receiver name is required'],
      trim: true,
      minlength: [2, 'Receiver name must be at least 2 characters'],
      maxlength: [100, 'Receiver name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      minlength: [8, 'Phone number must be at least 8 digits'],
      maxlength: [15, 'Phone number cannot exceed 15 digits'],
    },
    house: {
      type: String,
      required: [true, 'House / Flat / Building is required'],
      trim: true,
      maxlength: [200, 'House details cannot exceed 200 characters'],
    },
    street: {
      type: String,
      required: [true, 'Street / Area is required'],
      trim: true,
      maxlength: [300, 'Street / Area cannot exceed 300 characters'],
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: [200, 'Landmark cannot exceed 200 characters'],
      default: '',
    },
    label: {
      type: String,
      enum: {
        values: ['Home', 'Work', 'Other'],
        message: '{VALUE} is not a valid address label',
      },
      default: 'Home',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Location coordinates [longitude, latitude] are required'],
        validate: {
          validator: function (val: number[]) {
            return (
              Array.isArray(val) &&
              val.length === 2 &&
              val[0] >= -180 &&
              val[0] <= 180 && // longitude
              val[1] >= -90 &&
              val[1] <= 90 // latitude
            );
          },
          message: 'Invalid coordinates: longitude must be between -180 and 180, latitude between -90 and 90',
        },
      },
    },
    formattedAddress: {
      type: String,
      trim: true,
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AddressSchema.index({ location: '2dsphere' });
AddressSchema.index({ user: 1, isDefault: 1 });
AddressSchema.index({ user: 1, createdAt: -1 });

export const Address: Model<IAddress> =
  mongoose.models.Address || mongoose.model<IAddress>('Address', AddressSchema);

