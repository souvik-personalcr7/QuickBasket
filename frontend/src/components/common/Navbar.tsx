'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Store, Bike, MapPin, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const Navbar: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, logout, role } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDeliveryPartner = mounted && isAuthenticated && role === 'delivery_partner';
  const isShopOwner = mounted && isAuthenticated && role === 'shop_owner';
  const isStaff = isDeliveryPartner || isShopOwner;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Location */}
          <div className="flex items-center gap-6">
            <Link
              href={isDeliveryPartner ? "/delivery" : isShopOwner ? "/shop" : "/"}
              className="flex items-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-sm bg-emerald-600 group-hover:bg-emerald-700 transition-colors">
                {isDeliveryPartner ? (
                  <Bike className="w-5 h-5" />
                ) : isShopOwner ? (
                  <Store className="w-5 h-5" />
                ) : (
                  'Q'
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Quick<span className="text-emerald-600">Basket</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider -mt-1">
                  {isDeliveryPartner
                    ? 'Rider Dispatch'
                    : isShopOwner
                    ? 'Merchant Portal'
                    : 'Hyperlocal Market'}
                </span>
              </div>
            </Link>

            {/* Address Selector Placeholder: Only show for customers */}
            {!isStaff && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium text-slate-900">Delivering to:</span>
                <span className="truncate max-w-[150px] text-slate-500">Sector 4, Main Market</span>
              </div>
            )}
          </div>


          {/* Role Navigation & Cart Entry */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isDeliveryPartner ? (
              <Link
                href="/delivery"
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 rounded-xl shadow-xs transition-colors"
              >
                <Bike className="w-4 h-4" />
                <span>Rider Dispatch Board</span>
              </Link>
            ) : isShopOwner ? (
              <Link
                href="/shop"
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 rounded-xl shadow-xs transition-colors"
              >
                <Store className="w-4 h-4" />
                <span>Store Catalog & Orders</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/shop"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-emerald-200 transition-colors"
                >
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Shop Owner</span>
                </Link>

                <Link
                  href="/delivery"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-emerald-200 transition-colors"
                >
                  <Bike className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Delivery Partner</span>
                </Link>
              </>
            )}

            {mounted && isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                >
                  {user.name.split(' ')[0]}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
            )}

            {!isStaff && (
              <Link
                href="/cart"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                <span className="bg-emerald-700 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  0
                </span>
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

