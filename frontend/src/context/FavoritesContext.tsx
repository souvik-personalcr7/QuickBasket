'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '@/data/mockData';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favorites: Product[];
  favoritesCount: number;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: Product) => void;
  addFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);

  // Compute storage key based on current authenticated customer or guest
  const getStorageKey = useCallback(() => {
    if (typeof window === 'undefined') return 'qb_customer_favorites_guest';
    const userId = user?.id || (user?.email ? user.email.toLowerCase().trim() : null);
    return userId ? `qb_customer_favorites_${userId}` : 'qb_customer_favorites_guest';
  }, [user?.id, user?.email]);

  // Load favorites from localStorage
  const loadFavorites = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const activeKey = getStorageKey();
      let saved = localStorage.getItem(activeKey);

      // If user just logged in and user's list is empty, merge guest favorites if any
      if ((!saved || saved === '[]') && activeKey !== 'qb_customer_favorites_guest') {
        const guestSaved = localStorage.getItem('qb_customer_favorites_guest');
        if (guestSaved && guestSaved !== '[]') {
          saved = guestSaved;
          localStorage.setItem(activeKey, guestSaved);
          localStorage.removeItem('qb_customer_favorites_guest');
        }
      }

      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
          return;
        }
      }
      setFavorites([]);
    } catch (e) {
      console.warn('Failed to load favorites from localStorage', e);
      setFavorites([]);
    }
  }, [getStorageKey]);

  // Initial load and user change
  useEffect(() => {
    setMounted(true);
    loadFavorites();
  }, [loadFavorites]);

  // Listen to cross-tab & custom storage events
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      const activeKey = getStorageKey();
      if (e.key === activeKey) {
        loadFavorites();
      }
    };

    const handleCustomEvent = () => {
      loadFavorites();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('qb:favorites_updated', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('qb:favorites_updated', handleCustomEvent);
    };
  }, [mounted, getStorageKey, loadFavorites]);

  // Persist helper that supports both direct arrays and functional updaters
  const persistFavorites = useCallback(
    (updater: Product[] | ((prev: Product[]) => Product[])) => {
      setFavorites((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (typeof window !== 'undefined') {
          try {
            const key = getStorageKey();
            localStorage.setItem(key, JSON.stringify(next));
            window.dispatchEvent(new Event('qb:favorites_updated'));
          } catch (e) {
            console.warn('Failed to save favorites to localStorage', e);
          }
        }
        return next;
      });
    },
    [getStorageKey]
  );

  const isFavorite = useCallback(
    (productId: string) => {
      if (!productId) return false;
      return favorites.some((item) => item.id === productId);
    },
    [favorites]
  );

  const addFavorite = useCallback(
    (product: Product) => {
      if (!product || !product.id) return;
      persistFavorites((prev) => {
        if (prev.some((p) => p.id === product.id)) return prev;
        return [product, ...prev];
      });
    },
    [persistFavorites]
  );

  const removeFavorite = useCallback(
    (productId: string) => {
      if (!productId) return;
      persistFavorites((prev) => prev.filter((item) => item.id !== productId));
    },
    [persistFavorites]
  );

  const toggleFavorite = useCallback(
    (product: Product) => {
      if (!product || !product.id) return;
      persistFavorites((prev) => {
        const exists = prev.some((item) => item.id === product.id);
        return exists
          ? prev.filter((item) => item.id !== product.id)
          : [product, ...prev];
      });
    },
    [persistFavorites]
  );

  const clearFavorites = useCallback(() => {
    persistFavorites([]);
  }, [persistFavorites]);

  const favoritesCount = favorites.length;

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoritesCount,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    return {
      favorites: [],
      favoritesCount: 0,
      isFavorite: () => false,
      toggleFavorite: () => {},
      addFavorite: () => {},
      removeFavorite: () => {},
      clearFavorites: () => {},
    };
  }
  return context;
};
