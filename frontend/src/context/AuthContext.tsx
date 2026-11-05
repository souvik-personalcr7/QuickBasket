'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole, UserAddress, ShopDetails, LoginCredentials, RegisterCredentials } from '@/types/auth';
import { apiClient } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string; role?: UserRole }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; message?: string; role?: UserRole }>;
  logout: () => Promise<void>;
  updateUserAddress: (address: UserAddress) => Promise<{ success: boolean; message?: string }>;
  updateShopDetails: (details: Partial<ShopDetails>) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
  getRoleRedirectPath: (role: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const getRoleRedirectPath = (role: UserRole): string => {
  switch (role) {
    case 'shop_owner':
      return '/shop';
    case 'delivery_partner':
      return '/delivery';
    case 'admin':
      return '/admin';
    case 'customer':
    default:
      return '/';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Fetch current user from server session (HTTP-only cookie)
  const refreshUser = useCallback(async () => {
    try {
      const response = await apiClient<{ user: User }>('/auth/me');
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; message?: string; role?: UserRole }> => {
    try {
      const response = await apiClient<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.success && response.data?.user) {
        const loggedUser = response.data.user;
        setUser(loggedUser);

        // Ensure token cookie is set for Next.js server-side middleware
        if (typeof document !== 'undefined' && response.data?.token) {
          const isSecure = window.location.protocol === 'https:';
          document.cookie = `token=${response.data.token}; path=/; max-age=31536000; SameSite=Lax${isSecure ? '; Secure' : ''}`;
        }

        return {
          success: true,
          role: loggedUser.role,
        };
      }

      return {
        success: false,
        message: response.message || 'Login failed. Please verify your credentials.',
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Network error occurred during login',
      };
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<{ success: boolean; message?: string; role?: UserRole }> => {
    try {
      const response = await apiClient<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.success && response.data?.user) {
        const newUser = response.data.user;
        setUser(newUser);

        // Ensure token cookie is set for Next.js server-side middleware
        if (typeof document !== 'undefined' && response.data?.token) {
          const isSecure = window.location.protocol === 'https:';
          document.cookie = `token=${response.data.token}; path=/; max-age=31536000; SameSite=Lax${isSecure ? '; Secure' : ''}`;
        }

        return {
          success: true,
          role: newUser.role,
        };
      }

      return {
        success: false,
        message: response.message || 'Registration failed. Please check your details.',
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Network error occurred during registration',
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } finally {
      if (typeof document !== 'undefined') {
        document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
      }
      setUser(null);
      router.push('/login');
    }
  };

  const updateUserAddress = async (
    address: UserAddress
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiClient<{ user: User }>('/auth/address', {
        method: 'PATCH',
        body: JSON.stringify(address),
      });

      if (response.success && response.data?.user) {
        setUser(response.data.user);
        return { success: true, message: response.message || 'Primary address updated successfully' };
      }

      // Guest / local fallback if user is logged in locally
      if (user) {
        setUser({ ...user, address });
        return { success: true, message: 'Primary address updated' };
      }

      return {
        success: false,
        message: response.message || 'Failed to update address',
      };
    } catch (err) {
      if (user) {
        setUser({ ...user, address });
        return { success: true, message: 'Primary address updated' };
      }
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Network error updating address',
      };
    }
  };

  const updateShopDetails = async (
    details: Partial<ShopDetails>
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiClient<{ user: User }>('/auth/shop-details', {
        method: 'PATCH',
        body: JSON.stringify(details),
      });

      if (response.success && response.data?.user) {
        setUser(response.data.user);
        return { success: true, message: response.message || 'Storefront details updated successfully' };
      }

      // Guest / local fallback
      if (user) {
        const updatedShop = { ...(user.shopDetails || {}), ...details };
        setUser({ ...user, shopDetails: updatedShop });
        return { success: true, message: 'Storefront details updated' };
      }

      return {
        success: false,
        message: response.message || 'Failed to update storefront details',
      };
    } catch (err) {
      if (user) {
        const updatedShop = { ...(user.shopDetails || {}), ...details };
        setUser({ ...user, shopDetails: updatedShop });
        return { success: true, message: 'Storefront details updated' };
      }
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Network error updating storefront details',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUserAddress,
        updateShopDetails,
        refreshUser,
        getRoleRedirectPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
