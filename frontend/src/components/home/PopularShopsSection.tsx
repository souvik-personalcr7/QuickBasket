'use client';

import React from 'react';
import Link from 'next/link';
import { Store, UserPlus } from 'lucide-react';
import { Shop } from '@/data/mockData';
import { ShopCard } from './ShopCard';

interface PopularShopsSectionProps {
  shops?: Shop[];
  onSelectShop?: (shop: Shop) => void;
  selectedShopId?: string;
}

export const PopularShopsSection: React.FC<PopularShopsSectionProps> = ({
  shops = [],
  onSelectShop,
  selectedShopId,
}) => {
  return (
    <section id="shops" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Section Header - Perfectly aligned with other sections */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f3d23] tracking-tight">
            Popular Shops Near You
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {shops.length > 0
              ? 'Click on any store to view all products listed by that shop owner'
              : 'Verified neighborhood store owners'}
          </p>
        </div>
        {shops.length > 0 && (
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 whitespace-nowrap">
            {shops.length} Active {shops.length === 1 ? 'Store' : 'Stores'}
          </span>
        )}
      </div>

      {/* Grid of Real Shops OR Empty State */}
      {shops.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 items-stretch">
          {shops.map((shop) => (
            <div key={shop.id} className="h-full">
              <ShopCard
                shop={shop}
                onSelect={onSelectShop}
                isSelected={selectedShopId === shop.id}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50/70 rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mx-auto">
            <Store className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-extrabold text-slate-900">
              No Local Shops Registered Yet
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Only authentic stores created by registered shop owners are shown here. Once a merchant registers their shop, it will be listed immediately.
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/signup?role=shop_owner"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register as Shop Owner</span>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
};
