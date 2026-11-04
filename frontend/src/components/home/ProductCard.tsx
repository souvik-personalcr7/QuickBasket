'use client';

import React, { useState } from 'react';
import { Heart, ShoppingCart, Check, IndianRupee } from 'lucide-react';
import { Product } from '@/data/mockData';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const isOutOfStock = typeof product.stock === 'number' && product.stock <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;
    setIsAdded(true);
    onAddToCart?.(product);
    setTimeout(() => {
      setIsAdded(false);
    }, 1200);
  };

  return (
    <div className="group relative w-full bg-white rounded-2xl border border-slate-100/80 p-2 sm:p-2.5 flex flex-col justify-between shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_20px_-4px_rgba(21,128,61,0.12)] hover:border-emerald-200 transition-all duration-200">
      
      {/* Out of stock badge */}
      {isOutOfStock && (
        <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
          Not available right now
        </span>
      )}

      {/* Wishlist Button: Compact top-right badge */}
      <button
        type="button"
        onClick={() => setIsFavorite(!isFavorite)}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        className={`absolute top-2 right-2 z-10 p-1 rounded-full transition-colors backdrop-blur-xs shadow-2xs ${
          isFavorite
            ? 'text-rose-500 bg-rose-50/90'
            : 'text-slate-400 bg-white/80 hover:text-rose-500 hover:bg-white'
        }`}
      >
        <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500' : ''}`} />
      </button>

      {/* Top Section: Image and Info */}
      <div className="flex flex-col">
        {/* Product Image Container: Compact and centered */}
        <div className="w-full h-20 sm:h-24 rounded-xl bg-slate-50/70 flex items-center justify-center p-1.5 mb-2 overflow-hidden group-hover:scale-104 transition-transform duration-200">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply"
            loading="lazy"
          />
        </div>

        {/* Product Name, Quantity & Price in a Single Row */}
        <div className="flex items-center justify-between gap-1.5 w-full pt-1">
          <div className="flex items-baseline gap-1 min-w-0 flex-1">
            <h3
              title={product.name}
              className="text-xs sm:text-sm font-bold text-slate-800 truncate leading-tight group-hover:text-[#15803d] transition-colors"
            >
              {product.name}
            </h3>
            {product.unit && (
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium shrink-0">
                • {product.unit}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1 shrink-0">
            <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight inline-flex items-center">
              <IndianRupee className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
              <span>{product.price}</span>
            </span>
            {product.originalPrice && (
              <span className="text-[10px] text-slate-400 line-through font-medium hidden sm:inline-flex items-center">
                <IndianRupee className="w-2.5 h-2.5 stroke-[2]" />
                <span>{product.originalPrice}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Add to Cart Button: Compact & neat */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={isOutOfStock}
        className={`w-full mt-2 py-1.5 px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all duration-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:ring-offset-1 ${
          isOutOfStock
            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            : isAdded
            ? 'bg-emerald-700 text-white cursor-pointer'
            : 'bg-[#135d38] hover:bg-[#0f4e2e] text-white active:scale-98 cursor-pointer'
        }`}
      >
        {isOutOfStock ? (
          <span>Not Available</span>
        ) : isAdded ? (
          <>
            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
            <span>Added</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Add</span>
          </>
        )}
      </button>

    </div>
  );
};
