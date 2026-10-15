import React from 'react';
import Link from 'next/link';
import { POPULAR_SHOPS } from '@/data/mockData';
import { ShopCard } from './ShopCard';

export const PopularShopsSection: React.FC = () => {
  return (
    <section id="shops" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f3d23] tracking-tight">
          Popular Shops Near You
        </h2>
        <Link
          href="#all-shops"
          className="text-xs sm:text-sm font-bold text-[#15803d] hover:text-[#166534] flex items-center gap-1 transition-colors"
        >
          View All <span className="text-base">&rarr;</span>
        </Link>
      </div>

      {/* Grid: 1 col on mobile, 2 cols on tablet, 4 cols on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {POPULAR_SHOPS.map((shop) => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </div>
    </section>
  );
};
