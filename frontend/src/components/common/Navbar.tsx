'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Store, Bike, MapPin, Search } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Location */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-sm group-hover:bg-emerald-700 transition-colors">
                Q
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Quick<span className="text-emerald-600">Basket</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider -mt-1">
                  Hyperlocal Market
                </span>
              </div>
            </Link>

            {/* Address Selector Placeholder */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-medium text-slate-900">Delivering to:</span>
              <span className="truncate max-w-[150px] text-slate-500">Sector 4, Main Market</span>
            </div>
          </div>

          {/* Search Bar Preview */}
          <div className="hidden lg:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search fresh groceries, local shops & regional items..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                readOnly
              />
            </div>
          </div>

          {/* Role Navigation & Cart Entry */}
          <div className="flex items-center gap-2 sm:gap-3">
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

            <Link
              href="/login"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>

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
          </div>

        </div>
      </div>
    </header>
  );
};
