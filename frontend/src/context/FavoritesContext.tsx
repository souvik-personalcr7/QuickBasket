'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '@/data/mockData';
import { useAuth } from './AuthContext';
import { AuthRequiredModal } from '@/components/common/AuthRequiredModal';

interface FavoritesContextType {
  favorites: Product[];
  favoritesCount: number;
  isFavorite: (productId: string | number) => boolean;
  toggleFavorite: (product: Product) => void;
  addFavorite: (product: Product) => void;
  removeFavorite: (productId: string | number) => void;
  clearFavorites: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const normalizeId = (id: any): string => {
  if (id === null || id === undefined) return '';
  return String(id).trim();
};

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isInternalDispatchRef = useRef(false);
  const hasMigratedGuestRef = useRef(false);

  // Compute storage key based on current authenticated customer or guest
  const getStorageKey = useCallback(() => {
    if (typeof window === 'undefined') return 'qb_customer_favorites_guest';
    const userId = user?.id || (user?.email ? user.email.toLowerCase().trim() : null);
    return userId ? `qb_customer_favorites_${userId}` : 'qb_customer_favorites_guest';
  }, [user?.id, user?.email]);

  // Load favorites from localStorage
  const loadFavorites = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Guests cannot store or access account favorites
    if (!isAuthenticated) {
      setFavorites([]);
      return;
    }

    try {
      const activeKey = getStorageKey();
      let saved = localStorage.getItem(activeKey);

      // One-time migration: Only if this user key has NEVER been created (null) and guest favorites exist
      if (
        saved === null &&
        activeKey !== 'qb_customer_favorites_guest' &&
        !hasMigratedGuestRef.current
      ) {
        hasMigratedGuestRef.current = true;
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
  }, [getStorageKey, isAuthenticated]);

  // Initial load and user change
  useEffect(() => {
    setMounted(true);
    loadFavorites();
  }, [loadFavorites]);

  // Listen to cross-tab & custom storage events without recursive self-reloads
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      const activeKey = getStorageKey();
      if (e.key === activeKey) {
        loadFavorites();
      }
    };

    const handleCustomEvent = () => {
      if (isInternalDispatchRef.current) {
        return;
      }
      loadFavorites();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('qb:favorites_updated', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('qb:favorites_updated', handleCustomEvent);
    };
  }, [mounted, getStorageKey, loadFavorites]);

  // Persist helper that writes synchronously to localStorage and updates React state
  const persistFavorites = useCallback(
    (updater: Product[] | ((prev: Product[]) => Product[])) => {
      setFavorites((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (typeof window !== 'undefined') {
          try {
            const key = getStorageKey();
            localStorage.setItem(key, JSON.stringify(next));
          } catch (e) {
            console.warn('Failed to save favorites to localStorage', e);
          }
        }
        return next;
      });

      // Notify external consumers asynchronously without triggering redundant self-reload
      if (typeof window !== 'undefined') {
        isInternalDispatchRef.current = true;
        try {
          window.dispatchEvent(new Event('qb:favorites_updated'));
        } finally {
          setTimeout(() => {
            isInternalDispatchRef.current = false;
          }, 60);
        }
      }
    },
    [getStorageKey]
  );

  const isFavorite = useCallback(
    (productId: string | number) => {
      if (!isAuthenticated) return false;
      const targetId = normalizeId(productId);
      if (!targetId) return false;
      return favorites.some((item) => {
        const itemId = normalizeId(item?.id || (item as any)?._id);
        return itemId === targetId;
      });
    },
    [favorites, isAuthenticated]
  );

  const addFavorite = useCallback(
    (product: Product) => {
      if (!isAuthenticated) {
        setIsAuthModalOpen(true);
        return;
      }
      if (!product) return;
      const targetId = normalizeId(product.id || (product as any)?._id);
      if (!targetId) return;

      persistFavorites((prev) => {
        const exists = prev.some((p) => {
          const itemId = normalizeId(p?.id || (p as any)?._id);
          return itemId === targetId;
        });
        if (exists) return prev;
        return [{ ...product, id: targetId }, ...prev];
      });
    },
    [isAuthenticated, persistFavorites]
  );

  const removeFavorite = useCallback(
    (productId: string | number) => {
      const targetId = normalizeId(productId);
      if (!targetId) return;
      persistFavorites((prev) =>
        prev.filter((item) => {
          const itemId = normalizeId(item?.id || (item as any)?._id);
          return itemId !== targetId;
        })
      );
    },
    [persistFavorites]
  );

  const toggleFavorite = useCallback(
    (product: Product) => {
      // If user is not logged in, they cannot favorite products -> pop up login/signup modal
      if (!isAuthenticated) {
        setIsAuthModalOpen(true);
        return;
      }

      if (!product) return;
      const targetId = normalizeId(product.id || (product as any)?._id);
      if (!targetId) return;

      persistFavorites((prev) => {
        const exists = prev.some((item) => {
          const itemId = normalizeId(item?.id || (item as any)?._id);
          return itemId === targetId;
        });

        if (exists) {
          // If already favorited -> Remove it immediately
          return prev.filter((item) => {
            const itemId = normalizeId(item?.id || (item as any)?._id);
            return itemId !== targetId;
          });
        } else {
          // If not favorited -> Add to favorites
          return [{ ...product, id: targetId }, ...prev];
        }
      });
    },
    [isAuthenticated, persistFavorites]
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
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
      }}
    >
      {children}
      {/* Global Auth Required Modal for Favorites */}
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
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
      isAuthModalOpen: false,
      openAuthModal: () => {},
      closeAuthModal: () => {},
    };
  }
  return context;
};
