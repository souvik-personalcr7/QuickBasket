'use client';

import React, { useState } from 'react';
import { Star, Bike, ChevronRight, Eye } from 'lucide-react';
import { Shop } from '@/data/mockData';
import { getStoredShopImage } from '@/lib/imageUtils';
import { ShopImageModal } from './ShopImageModal';

interface ShopCardProps {
  shop: Shop;
  onSelect?: (shop: Shop) => void;
  isSelected?: boolean;
}

export const ShopCard: React.FC<ShopCardProps> = ({ shop, onSelect, isSelected }) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const cardImage = getStoredShopImage(shop);
  const itemCount =
    (typeof shop.productCount === 'number' && shop.productCount > 0)
      ? shop.productCount
      : (shop.products && shop.products.length > 0)
      ? shop.products.length
      : 0;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect?.(shop)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect?.(shop);
          }
        }}
        className={`group w-full h-full text-left bg-white rounded-2xl border p-3 sm:p-3.5 flex items-center gap-3 sm:gap-3.5 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 cursor-pointer overflow-hidden ${
          isSelected
            ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/30 shadow-xs'
            : 'border-slate-200/80 hover:bg-slate-50/40'
        }`}
      >
        {/* Shop Thumbnail (Clickable to preview storefront image) */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsImageModalOpen(true);
          }}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 shrink-0 relative border border-slate-100 shadow-2xs cursor-pointer group/thumb"
          title="Click to view storefront photo"
        >
          <img
            src={cardImage}
            alt={shop.name}
            className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[1px]">
            <Eye className="w-4 h-4 drop-shadow-sm" />
          </div>
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

          {/* Rating and Delivery Time */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="flex items-center gap-0.5 font-bold text-slate-800 text-[11px] shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
              <span>{shop.rating}</span>
              <span className="text-slate-400 font-normal text-[10px]">
                ({shop.reviewCount})
              </span>
            </span>

            <span className="text-slate-300 text-xs shrink-0">•</span>

            <span className="text-[11px] text-slate-500 font-medium truncate">
              {shop.deliveryTime || '20-30 mins'}
            </span>
          </div>

          {/* Badges Container: Item Count + Free Delivery Badge (Always stays inside card on every screen size) */}
          {(itemCount > 0 || shop.isFreeDelivery) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {itemCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 whitespace-nowrap shrink-0">
                  <span>{itemCount}</span>
                  <span>{itemCount === 1 ? 'Item' : 'Items'}</span>
                </span>
              )}

              {shop.isFreeDelivery && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 whitespace-nowrap shrink-0">
                  <Bike className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                  <span>Free Delivery</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Large Storefront Image Preview Modal (Same as ProductImageModal) */}
      <ShopImageModal
        shop={{
          name: shop.name,
          image: cardImage,
          category: shop.category,
          address: shop.address,
          rating: shop.rating,
          reviewCount: shop.reviewCount,
          deliveryTime: shop.deliveryTime,
          isOpen: shop.isOpen,
          isFreeDelivery: shop.isFreeDelivery,
          productCount: itemCount,
        }}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onVisitShop={() => onSelect?.(shop)}
      />
    </>
  );
};
