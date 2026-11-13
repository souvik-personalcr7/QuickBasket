'use client';

import React, { useEffect } from 'react';
import {
  X,
  Store,
  Star,
  Clock,
  MapPin,
  Bike,
  Check,
  AlertCircle,
  ShoppingBag,
  Camera,
  ExternalLink,
} from 'lucide-react';

export interface ShopImagePreviewData {
  name: string;
  image?: string;
  category?: string;
  address?: string;
  rating?: number | string;
  reviewCount?: string | number;
  deliveryTime?: string;
  isOpen?: boolean;
  isFreeDelivery?: boolean;
  productCount?: number;
}

interface ShopImageModalProps {
  shop: ShopImagePreviewData | null;
  isOpen: boolean;
  onClose: () => void;
  onVisitShop?: () => void;
  isOwner?: boolean;
  onEditImage?: () => void;
}

export const ShopImageModal: React.FC<ShopImageModalProps> = ({
  shop,
  isOpen,
  onClose,
  onVisitShop,
  isOwner = false,
  onEditImage,
}) => {
  // Lock scroll and handle ESC key (same pattern as ProductImageModal)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !shop) return null;

  const fallbackImage =
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80';
  const displayImage = shop.image && shop.image.trim().length > 0 ? shop.image : fallbackImage;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/80 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap shrink-0 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>Storefront Preview</span>
            </span>
            {shop.category && (
              <span className="whitespace-nowrap shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 capitalize">
                {shop.category}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            aria-label="Close storefront preview"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Large Image Presentation (Matches ProductImageModal) */}
        <div className="relative w-full h-64 sm:h-80 bg-slate-900/10 flex items-center justify-center overflow-hidden group">
          <img
            src={displayImage}
            alt={shop.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Status Badge Over Image */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
            {shop.isOpen === false ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100/95 text-amber-900 border border-amber-300 shadow-sm flex items-center gap-1 backdrop-blur-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Currently Closed</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600/95 text-white shadow-sm flex items-center gap-1 backdrop-blur-xs">
                <Check className="w-3.5 h-3.5" />
                <span>Open for Orders</span>
              </span>
            )}
          </div>

          {/* Rating Badge Over Image */}
          {Boolean(shop.rating) && (
            <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 backdrop-blur-xs text-slate-900 shadow-md flex items-center gap-1 border border-slate-100 pointer-events-none">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{shop.rating}</span>
              {Boolean(shop.reviewCount) && (
                <span className="text-slate-400 font-normal text-[10px]">
                  ({shop.reviewCount})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Shop Details & Actions */}
        <div className="p-4 sm:p-5 bg-white space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {shop.category && (
                <span className="whitespace-nowrap shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {shop.category}
                </span>
              )}
              {shop.isFreeDelivery && (
                <span className="whitespace-nowrap shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <Bike className="w-2.5 h-2.5 text-blue-600" />
                  <span>Free Delivery</span>
                </span>
              )}
              {typeof shop.productCount === 'number' && shop.productCount > 0 && (
                <span className="whitespace-nowrap shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {shop.productCount} Products in Catalog
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              {shop.name}
            </h2>

            {shop.address && (
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="line-clamp-2">{shop.address}</span>
              </p>
            )}

            {shop.deliveryTime && (
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Estimated Delivery: {shop.deliveryTime}</span>
              </p>
            )}
          </div>

          {/* Quick Actions Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>

            {isOwner ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditImage?.();
                }}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#15803d] hover:bg-[#166534] text-white shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Change Photo</span>
              </button>
            ) : onVisitShop ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onVisitShop();
                }}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#15803d] hover:bg-[#166534] text-white shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explore Store</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
