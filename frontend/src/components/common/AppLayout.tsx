'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider, useCart } from '@/context/CartContext';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';

const LayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { cartCount } = useCart();

  return (
    <div className="min-h-full flex flex-col bg-white text-slate-900 pb-16 md:pb-0">
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
      <CartProvider>
        <LayoutContent>{children}</LayoutContent>
      </CartProvider>
    </AuthProvider>
  );
};

