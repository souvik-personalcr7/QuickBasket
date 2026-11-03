'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Store, PlusCircle } from 'lucide-react';
import { Product } from '@/data/mockData';
import { ProductCard } from './ProductCard';

interface FeaturedProductsSectionProps {
  products?: Product[];
  onAddToCart?: (product: Product) => void;
}

export const FeaturedProductsSection: React.FC<FeaturedProductsSectionProps> = ({
  products = [],
  onAddToCart,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedProducts = isExpanded ? products : products.slice(0, 14);

  return (
    <section id="featured-products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f3d23] tracking-tight">
            Featured Products
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fresh products added by verified local store owners
          </p>
        </div>

        {products.length > 14 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs sm:text-sm font-bold text-[#15803d] hover:text-[#166534] flex items-center gap-1 transition-colors cursor-pointer group"
          >
            <span>{isExpanded ? 'Show Less' : 'View All'}</span>
            <span className="text-base group-hover:translate-x-0.5 transition-transform">
              {isExpanded ? '↑' : '→'}
            </span>
          </button>
        )}
      </div>

      {/* Grid of Real Products OR Empty State */}
      {products.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
          {displayedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-50/70 rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mx-auto">
            <Store className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-extrabold text-slate-900">
              No Products Added Yet
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Only products published by registered shop owners appear here. When a shop owner adds items to their inventory, they will show up instantly.
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Products as Shop Owner</span>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
};
