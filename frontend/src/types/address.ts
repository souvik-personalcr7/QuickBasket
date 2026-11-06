export type AddressLabel = 'Home' | 'Work' | 'Other';

export interface IAddressLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Address {
  _id: string;
  user?: string;
  shopName?: string;
  receiverName: string;
  phone: string;
  house: string;
  street: string;
  landmark?: string;
  label: AddressLabel;
  location: IAddressLocation;
  formattedAddress?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddressFormData {
  shopName?: string;
  receiverName: string;
  phone: string;
  house: string;
  street: string;
  landmark?: string;
  label: AddressLabel;
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  isDefault?: boolean;
}

