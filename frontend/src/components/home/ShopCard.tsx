import React from 'react';
import Link from 'next/link';
import { Star, Bike, ChevronRight } from 'lucide-react';
import { Shop } from '@/data/mockData';

interface ShopCardProps {
  shop: Shop;
}

export const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  return (
    <Link
      href={`#shop-${shop.id}`}
      className="group bg-white rounded-2xl border border-slate-100 p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_-4px_rgba(21,128,61,0.1)] hover:border-emerald-200 transition-all duration-200"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Shop Thumbnail */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
          <img
            src={shop.image}
            alt={shop.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        </div>

        {/* Shop Info */}
        <div className="space-y-0.5 min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#15803d] transition-colors truncate">
            {shop.name}
          </h3>
          <p className="text-xs text-slate-500 truncate">
            {shop.category}
          </p>

          <div className="flex items-center gap-2 pt-0.5 text-xs">
            {/* Rating */}
            <span className="flex items-center gap-1 font-bold text-slate-800">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {shop.rating}
              <span className="text-slate-400 font-normal text-[11px]">
                ({shop.reviewCount})
              </span>
            </span>

            {/* Free Delivery Tag */}
            {shop.isFreeDelivery && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803d]">
                <Bike className="w-3 h-3 text-[#15803d]" />
                Free Delivery
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Arrow / Action */}
      <div className="p-1 text-slate-300 group-hover:text-[#15803d] group-hover:translate-x-0.5 transition-all">
        <ChevronRight className="w-5 h-5" />
      </div>
    </Link>
  );
};
