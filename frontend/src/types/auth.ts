export type UserRole = 'customer' | 'shop_owner' | 'delivery_partner' | 'admin';

export interface UserAddress {
  street?: string;
  city?: string;
  postalCode?: string;
  state?: string;
}

export interface ShopDetails {
  shopName?: string;
  category?: string;
  address?: string;
  isApproved?: boolean;
}

export interface DeliveryDetails {
  vehicleType?: string;
  vehicleNumber?: string;
  isAvailable?: boolean;
  city?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  address?: UserAddress;
  shopDetails?: ShopDetails;
  deliveryDetails?: DeliveryDetails;
  isActive: boolean;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role?: UserRole;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword?: string;
  role: UserRole;
  address?: UserAddress;
  shopDetails?: ShopDetails;
  deliveryDetails?: DeliveryDetails;
}
