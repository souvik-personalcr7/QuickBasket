import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'customer' | 'shop_owner' | 'delivery_partner' | 'admin';

export interface IUserAddress {
  street?: string;
  city?: string;
  postalCode?: string;
  state?: string;
}

export interface IShopDetails {
  shopName?: string;
  category?: string;
  address?: string;
  image?: string;
  isApproved?: boolean;
}

export interface IDeliveryDetails {
  vehicleType?: string;
  vehicleNumber?: string;
  isAvailable?: boolean;
  city?: string;
  isApproved?: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  address?: IUserAddress;
  shopDetails?: IShopDetails;
  deliveryDetails?: IDeliveryDetails;
  resetPasswordOtp?: string;
  resetPasswordOtpExpires?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password in normal queries
    },
    role: {
      type: String,
      enum: {
        values: ['customer', 'shop_owner', 'delivery_partner', 'admin'],
        message: '{VALUE} is not a valid user role',
      },
      default: 'customer',
      index: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      postalCode: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
    },
    shopDetails: {
      shopName: { type: String, trim: true, default: '' },
      category: { type: String, trim: true, default: '' },
      address: { type: String, trim: true, default: '' },
      image: { type: String, trim: true, default: '' },
      isApproved: { type: Boolean, default: true },
    },
    deliveryDetails: {
      vehicleType: { type: String, trim: true, default: '' },
      vehicleNumber: { type: String, trim: true, default: '' },
      isAvailable: { type: Boolean, default: true },
      city: { type: String, trim: true, default: '' },
      isApproved: { type: Boolean, default: true },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    resetPasswordOtp: {
      type: String,
      default: undefined,
      select: false,
    },
    resetPasswordOtpExpires: {
      type: Date,
      default: undefined,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.resetPasswordOtp;
        delete ret.resetPasswordOtpExpires;
        return ret;
      },
    },
  }

);

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Compare password helper
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
