'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Check, IndianRupee, Eye } from 'lucide-react';
import { Product } from '@/data/mockData';
import { useFavorites } from '@/context/FavoritesContext';
import { useCart } from '@/context/CartContext';
import { ProductImageModal } from './ProductImageModal';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const router = useRouter();
  const { isFavorite: checkFavorite, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const productId = product?.id || (product as any)?._id || '';
  const isFavorite = checkFavorite(productId);
  const [isAdded, setIsAdded] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const isOutOfStock = typeof product.stock === 'number' && product.stock <= 0;

  const handleBuyNow = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isOutOfStock) return;
    setIsAdded(true);
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addToCart(product);
    }
    // Navigate directly to the Buy Now / Checkout page
    router.push('/buy-now');
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({ ...product, id: productId });
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsImageModalOpen(true);
  };

  return (
    <div className="group relative w-full h-full bg-white rounded-2xl border border-slate-100/80 p-2 sm:p-2.5 flex flex-col justify-between shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_20px_-4px_rgba(21,128,61,0.12)] hover:border-emerald-200 transition-all duration-200">
      
      {/* Out of stock badge */}
      {isOutOfStock && (
        <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
          Not available right now
        </span>
      )}

      {/* Wishlist / Favorite Button: Compact top-right badge */}
      <button
        type="button"
        onClick={handleFavoriteClick}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-all duration-200 backdrop-blur-xs shadow-2xs cursor-pointer ${
          isFavorite
            ? 'text-rose-500 bg-rose-50/95 ring-1 ring-rose-200 scale-105'
            : 'text-slate-400 bg-white/85 hover:text-rose-500 hover:bg-white hover:scale-105'
        }`}
      >
        <Heart className={`w-3.5 h-3.5 transition-transform ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
      </button>

      {/* 1st: Product Image & Bellow Image: Fully Visible Product Name */}
      <div className="flex flex-col flex-1">
        {/* 1st: Product Image Container (Clickable to preview large image) */}
        <div
          onClick={handleImageClick}
          className="relative group/image w-full h-20 sm:h-24 rounded-xl bg-slate-50/70 flex items-center justify-center p-1.5 mb-2 overflow-hidden cursor-pointer hover:bg-emerald-50/40 transition-colors"
          title="Click to view product image"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleImageClick(e as any);
            }
          }}
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply group-hover/image:scale-108 transition-transform duration-200"
            loading="lazy"
          />

          {/* Subtle View Indicator Overlay on Hover */}
          <div className="absolute inset-0 bg-slate-900/15 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
            <span className="p-1 rounded-full bg-white/95 text-slate-800 shadow-sm flex items-center gap-1 text-[10px] font-bold px-1.5">
              <Eye className="w-3 h-3 text-[#15803d]" />
              <span>View</span>
            </span>
          </div>
        </div>

        {/* Bellow of Product Image: Product Name Fully Visible in Every Device */}
        <div className="flex flex-col min-w-0 pt-0.5 flex-1 justify-start">
          <h3
            title={product.name}
            className="text-xs sm:text-sm font-bold text-slate-800 leading-snug break-words group-hover:text-[#15803d] transition-colors"
          >
            {product.name}
          </h3>
          {product.unit && (
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 inline-block">
              {product.unit}
            </span>
          )}
        </div>
      </div>

      {/* Bellow of the Name: Amount & Buy Now Button */}
      <div className="mt-2 pt-1.5 flex flex-col gap-1.5 border-t border-slate-50">
        {/* Amount (Price) */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight inline-flex items-center">
            <IndianRupee className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
            <span>{product.price}</span>
          </span>
          {product.originalPrice && (
            <span className="text-[10px] text-slate-400 line-through font-medium inline-flex items-center">
              <IndianRupee className="w-2.5 h-2.5 stroke-[2]" />
              <span>{product.originalPrice}</span>
            </span>
          )}
        </div>

        {/* Buy Now Button: Guaranteed single-row on all screens */}
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className={`w-full py-1.5 px-1.5 sm:px-2 rounded-xl text-[10px] sm:text-xs font-bold whitespace-nowrap shrink-0 flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:ring-offset-1 ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              : isAdded
              ? 'bg-emerald-700 text-white cursor-pointer'
              : 'bg-[#15803d] hover:bg-[#166534] text-white active:scale-98 cursor-pointer shadow-xs'
          }`}
        >
          {isOutOfStock ? (
            <span className="whitespace-nowrap shrink-0">Not Available</span>
          ) : isAdded ? (
            <span className="whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1">
              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3] shrink-0" />
              <span>Proceeding...</span>
            </span>
          ) : (
            <span className="whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1">
              <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Buy Now</span>
            </span>
          )}
        </button>
      </div>

      {/* Large Product Image Preview Modal */}
      <ProductImageModal
        product={{ ...product, id: productId }}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onBuyNow={() => handleBuyNow()}
        isFavorite={isFavorite}
        onToggleFavorite={(p) => toggleFavorite({ ...p, id: productId })}
      />

    </div>
  );
};

