'use client';

import React, { useEffect } from 'react';
import { X, Heart, ShoppingBag, IndianRupee, Store, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Product } from '@/data/mockData';

interface ProductImageModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onBuyNow?: (product: Product) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (product: Product) => void;
}

export const ProductImageModal: React.FC<ProductImageModalProps> = ({
  product,
  isOpen,
  onClose,
  onBuyNow,
  isFavorite = false,
  onToggleFavorite,
}) => {
  // Lock scroll and handle ESC key
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

  if (!isOpen || !product) return null;

  const isOutOfStock = typeof product.stock === 'number' && product.stock <= 0;

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
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap shrink-0">
              Preview
            </span>
            {product.category && (
              <span className="whitespace-nowrap shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 capitalize">
                {product.category}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Wishlist toggle in modal */}
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(product)}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isFavorite
                    ? 'text-rose-500 bg-rose-50 hover:bg-rose-100'
                    : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100'
                }`}
                title="Save to favorites"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
              </button>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              aria-label="Close image preview"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Large Image Presentation */}
        <div className="relative w-full h-64 sm:h-80 bg-slate-50 flex items-center justify-center p-6 overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 hover:scale-105"
          />

          {isOutOfStock && (
            <span className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-sm flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Not available right now
            </span>
          )}
        </div>

        {/* Product Details & Actions */}
        <div className="p-4 sm:p-5 bg-white space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {product.category && (
                <span className="whitespace-nowrap shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 capitalize">
                  {product.category}
                </span>
              )}
              {product.shopName && (
                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium truncate">
                  <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">From {product.shopName}</span>
                </div>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              {product.name}
            </h2>
            {product.unit && (
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Standard pack: {product.unit}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Price</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-900 inline-flex items-center">
                  <IndianRupee className="w-4 h-4 stroke-[2.5]" />
                  <span>{product.price}</span>
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs text-slate-400 line-through font-medium inline-flex items-center">
                    <IndianRupee className="w-3 h-3" />
                    <span>{product.originalPrice}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isOutOfStock) return;
                  onClose();
                  onBuyNow?.(product);
                }}
                disabled={isOutOfStock}
                className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all ${
                  isOutOfStock
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-[#15803d] hover:bg-[#166534] text-white cursor-pointer active:scale-95'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

