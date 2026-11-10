'use client';

import React from 'react';
import { Star, Bike, ChevronRight } from 'lucide-react';
import { Shop } from '@/data/mockData';
import { getStoredShopImage } from '@/lib/imageUtils';

interface ShopCardProps {
  shop: Shop;
  onSelect?: (shop: Shop) => void;
  isSelected?: boolean;
}

export const ShopCard: React.FC<ShopCardProps> = ({ shop, onSelect, isSelected }) => {
  const cardImage = getStoredShopImage(shop);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(shop)}
      className={`group w-full h-full text-left bg-white rounded-2xl border p-3.5 sm:p-4 flex items-center gap-3.5 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/30 shadow-xs'
          : 'border-slate-200/80 hover:bg-slate-50/40'
      }`}
    >
      {/* Shop Thumbnail */}
      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden bg-slate-100 shrink-0 relative border border-slate-100 shadow-2xs">
        <img
          src={cardImage}
          alt={shop.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {shop.isOpen === false && (
          <span className="absolute inset-0 bg-slate-900/65 flex items-center justify-center text-[10px] font-bold text-white backdrop-blur-[1px]">
            Closed
          </span>
        )}
      </div>

      {/* Shop Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1">
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
            {shop.name}
          </h3>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>

        <p className="text-xs text-slate-500 truncate font-medium">
          {shop.category}
        </p>

        <div className="flex items-center gap-2 pt-0.5 text-xs">
          {/* Rating */}
          <span className="flex items-center gap-1 font-bold text-slate-800 text-[11px] shrink-0">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
            <span>{shop.rating}</span>
            <span className="text-slate-400 font-normal text-[10px]">
              ({shop.reviewCount})
            </span>
          </span>

          <span className="text-slate-300 text-xs shrink-0">•</span>

          {/* Delivery Time */}
          <span className="text-[11px] text-slate-500 font-medium truncate">
            {shop.deliveryTime || '20-30 mins'}
          </span>

          {/* Store Items Count Badge (Always in a single row on mobile and desktop) */}
          {((typeof shop.productCount === 'number' && shop.productCount > 0) || (shop.products && shop.products.length > 0)) && (
            <>
              <span className="text-slate-300 text-xs shrink-0">•</span>
              <span className="text-[11px] text-emerald-700 font-bold whitespace-nowrap shrink-0 inline-flex items-center gap-1">
                <span>{shop.productCount || shop.products?.length}</span>
                <span>{(shop.productCount || shop.products?.length) === 1 ? 'item' : 'items'}</span>
              </span>
            </>
          )}

          {/* Free Delivery Tag */}
          {shop.isFreeDelivery && (
            <>
              <span className="text-slate-300 text-xs hidden sm:inline shrink-0">•</span>
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shrink-0">
                <Bike className="w-2.5 h-2.5" />
                Free
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
};
