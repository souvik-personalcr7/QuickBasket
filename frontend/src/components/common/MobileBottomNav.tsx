'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Grid, ShoppingBag, Receipt, User, Bike, Store, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface MobileBottomNavProps {
  cartCount?: number;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

interface NavTab {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  hasBadge?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartCount = 0,
  activeTab = 'home',
  onTabChange,
}) => {
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, role, getRoleRedirectPath } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDeliveryPartner = mounted && isAuthenticated && role === 'delivery_partner';
  const isShopOwner = mounted && isAuthenticated && role === 'shop_owner';

  const profileHref = mounted && isAuthenticated
    ? role === 'customer'
      ? '/profile'
      : getRoleRedirectPath(role!)
    : '/login';

  const ordersHref = mounted && isAuthenticated ? '/profile' : '#orders';

  const profileLabel = mounted && isAuthenticated && user?.name
    ? user.name.split(' ')[0]
    : 'Profile';

  const customerTabs: NavTab[] = [
    { id: 'home', label: 'Home', icon: Home, href: '/' },
    { id: 'categories', label: 'Categories', icon: Grid, href: '#categories' },
    { id: 'cart', label: 'Cart', icon: ShoppingBag, href: '/cart', hasBadge: true },
    { id: 'orders', label: 'Orders', icon: Receipt, href: ordersHref },
    { id: 'profile', label: profileLabel, icon: User, href: profileHref },
  ];

  const deliveryTabs: NavTab[] = [
    { id: 'dispatch', label: 'Dispatch', icon: Bike, href: '/delivery' },
    { id: 'profile', label: 'Rider Profile', icon: User, href: '/profile' },
  ];

  const shopOwnerTabs: NavTab[] = [
    { id: 'shop', label: 'Storefront', icon: Store, href: '/shop' },
    { id: 'profile', label: 'Store Profile', icon: User, href: '/profile' },
  ];

  const tabs: NavTab[] = isDeliveryPartner
    ? deliveryTabs
    : isShopOwner
    ? shopOwnerTabs
    : customerTabs;

  return (
    <nav
      suppressHydrationWarning
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className={`grid ${isDeliveryPartner || isShopOwner ? 'grid-cols-2' : 'grid-cols-5'} h-16 items-center px-2`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              suppressHydrationWarning
              onClick={() => onTabChange?.(tab.id)}
              className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
                isActive ? 'text-[#15803d]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.hasBadge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-[#15803d] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
