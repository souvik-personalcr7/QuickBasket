'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider, useCart } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';

const LayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { cartCount } = useCart();
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || (pathname ? pathname.startsWith('/login/') : false) ||
                     pathname === '/signup' || (pathname ? pathname.startsWith('/signup/') : false) ||
                     pathname === '/forgot-password' || (pathname ? pathname.startsWith('/forgot-password/') : false);

  return (
    <div className={`min-h-full flex flex-col bg-white text-slate-900 ${isAuthPage ? 'pb-0' : 'pb-16 md:pb-0'}`}>
      <Header cartCount={cartCount} />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileBottomNav cartCount={cartCount} />
    </div>
  );
};

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <CartProvider>
          <LayoutContent>{children}</LayoutContent>
        </CartProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
};

