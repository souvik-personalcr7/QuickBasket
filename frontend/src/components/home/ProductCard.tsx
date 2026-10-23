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

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdded(true);
    onAddToCart?.(product);
    setTimeout(() => {
      setIsAdded(false);
    }, 1200);
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 flex flex-col justify-between shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-5px_rgba(21,128,61,0.12)] hover:border-emerald-200 transition-all duration-200">
      
      {/* Top Bar: Wishlist Button */}
      <div className="flex justify-end w-full mb-1">
        <button
          type="button"
          onClick={() => setIsFavorite(!isFavorite)}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`p-1.5 rounded-full transition-colors ${
            isFavorite
              ? 'text-rose-500 bg-rose-50'
              : 'text-slate-400 hover:text-rose-500 hover:bg-slate-50'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
        </button>
      </div>

      {/* Product Image */}
      <div className="w-full aspect-square flex items-center justify-center p-2 mb-3 overflow-hidden rounded-xl bg-slate-50/50 group-hover:scale-103 transition-transform duration-200">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain mix-blend-multiply"
          loading="lazy"
        />
      </div>

      {/* Product Details */}
      <div className="space-y-1 mb-3">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1 group-hover:text-[#15803d] transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-slate-500">
          {product.unit}
        </p>
        
        {/* Price */}
        <div className="pt-1 flex items-center gap-2">
          <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight inline-flex items-center">
            <IndianRupee className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
            <span>{product.price}</span>
          </span>
          {product.originalPrice && (
            <span className="text-xs text-slate-400 line-through font-medium inline-flex items-center">
              <IndianRupee className="w-3 h-3 stroke-[2]" />
              <span>{product.originalPrice}</span>
            </span>
          )}
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        type="button"
        onClick={handleAdd}
        className={`w-full py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:ring-offset-1 ${
          isAdded
            ? 'bg-emerald-700 text-white'
            : 'bg-[#135d38] hover:bg-[#0f4e2e] text-white active:scale-98'
        }`}
      >
        {isAdded ? (
          <>
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            <span>Added</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Add to Cart</span>
          </>
        )}
      </button>

    </div>
  );
};
