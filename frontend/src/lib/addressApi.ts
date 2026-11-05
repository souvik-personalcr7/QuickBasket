import { apiClient } from './api';
import { Address, AddressFormData } from '@/types/address';

// Fallback guest storage key for local offline/guest sessions
const GUEST_ADDRESS_KEY = 'qb_guest_addresses';

export const getGuestAddresses = (): Address[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_ADDRESS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveGuestAddresses = (addresses: Address[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_ADDRESS_KEY, JSON.stringify(addresses));
  } catch {}
};

export async function fetchAddresses(): Promise<{ success: boolean; addresses: Address[]; message?: string }> {
  try {
    const res = await apiClient<{ addresses: Address[] }>('/addresses');
    if (res.success && res.data?.addresses) {
      return { success: true, addresses: res.data.addresses };
    }
    // Fallback to guest storage if unauthenticated
    const local = getGuestAddresses();
    return { success: true, addresses: local, message: res.message };
  } catch (error) {
    const local = getGuestAddresses();
    return { success: true, addresses: local };
  }
}

export async function createAddress(
  input: AddressFormData
): Promise<{ success: boolean; address?: Address; message?: string }> {
  try {
    const res = await apiClient<{ address: Address }>('/addresses', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    if (res.success && res.data?.address) {
      return { success: true, address: res.data.address };
    }

    // Guest fallback if not logged in
    const local = getGuestAddresses();
    const shouldBeDefault = local.length === 0 || !!input.isDefault;
    const newLocal: Address = {
      _id: `guest_${Date.now()}`,
      receiverName: input.receiverName,
      phone: input.phone,
      house: input.house,
      street: input.street,
      landmark: input.landmark,
      label: input.label,
      location: {
        type: 'Point',
        coordinates: [input.longitude, input.latitude],
      },
      formattedAddress: input.formattedAddress,
      isDefault: shouldBeDefault,
      createdAt: new Date().toISOString(),
    };

    const updatedList = shouldBeDefault
      ? local.map((a) => ({ ...a, isDefault: false }))
      : [...local];
    updatedList.unshift(newLocal);
    saveGuestAddresses(updatedList);

    return { success: true, address: newLocal };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to save address',
    };
  }
}

export async function updateAddress(
  id: string,
  input: Partial<AddressFormData>
): Promise<{ success: boolean; address?: Address; message?: string }> {
  try {
    if (!id.startsWith('guest_')) {
      const res = await apiClient<{ address: Address }>(`/addresses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });

      if (res.success && res.data?.address) {
        return { success: true, address: res.data.address };
      }
    }

    // Guest fallback
    const local = getGuestAddresses();
    let updated: Address | undefined;
    const nextList = local.map((addr) => {
      if (addr._id === id) {
        updated = {
          ...addr,
          ...input,
          location:
            input.latitude !== undefined && input.longitude !== undefined
              ? { type: 'Point', coordinates: [input.longitude, input.latitude] }
              : addr.location,
        };
        return updated;
      }
      return input.isDefault ? { ...addr, isDefault: false } : addr;
    });

    saveGuestAddresses(nextList);
    return { success: true, address: updated };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update address',
    };
  }
}

export async function deleteAddress(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    if (!id.startsWith('guest_')) {
      const res = await apiClient(`/addresses/${id}`, { method: 'DELETE' });
      if (res.success) {
        return { success: true };
      }
    }

    // Guest fallback
    const local = getGuestAddresses();
    const filtered = local.filter((a) => a._id !== id);
    if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
      filtered[0].isDefault = true;
    }
    saveGuestAddresses(filtered);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete address',
    };
  }
}

export async function setDefaultAddress(id: string): Promise<{ success: boolean; address?: Address; message?: string }> {
  try {
    if (!id.startsWith('guest_')) {
      const res = await apiClient<{ address: Address }>(`/addresses/${id}/default`, {
        method: 'PATCH',
      });
      if (res.success && res.data?.address) {
        return { success: true, address: res.data.address };
      }
    }

    // Guest fallback
    const local = getGuestAddresses();
    let defaultAddr: Address | undefined;
    const nextList = local.map((addr) => {
      const isTarget = addr._id === id;
      if (isTarget) defaultAddr = { ...addr, isDefault: true };
      return { ...addr, isDefault: isTarget };
    });
    saveGuestAddresses(nextList);
    return { success: true, address: defaultAddr };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to set default address',
    };
  }
}

/**
 * Reverse geocodes [lat, lng] to readable address parts using OpenStreetMap Nominatim.
 * Free, standard, no paid API required.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{
  formattedAddress: string;
  street: string;
  area: string;
  city: string;
  postcode: string;
}> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'QuickBasket/1.0',
        },
      }
    );

    if (!res.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await res.json();
    const address = data.address || {};

    const streetPart =
      address.road ||
      address.neighbourhood ||
      address.suburb ||
      address.pedestrian ||
      address.residential ||
      '';

    const areaPart =
      address.suburb ||
      address.city_district ||
      address.village ||
      address.county ||
      '';

    const cityPart =
      address.city ||
      address.town ||
      address.state_district ||
      address.state ||
      '';

    const postcode = address.postcode || '';

    const street = [streetPart, areaPart].filter(Boolean).join(', ') || streetPart;

    return {
      formattedAddress: data.display_name || '',
      street,
      area: areaPart,
      city: cityPart,
      postcode,
    };
  } catch (err) {
    console.warn('Reverse geocoding warning:', err);
    return {
      formattedAddress: '',
      street: '',
      area: '',
      city: '',
      postcode: '',
    };
  }
}

