'use client';

import React from 'react';
import Link from 'next/link';
import { FEATURED_PRODUCTS, Product } from '@/data/mockData';
import { ProductCard } from './ProductCard';

interface FeaturedProductsSectionProps {
  onAddToCart?: (product: Product) => void;
}

export const FeaturedProductsSection: React.FC<FeaturedProductsSectionProps> = ({ onAddToCart }) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f3d23] tracking-tight">
          Featured Products
        </h2>
        <Link
          href="#all-products"
          className="text-xs sm:text-sm font-bold text-[#15803d] hover:text-[#166534] flex items-center gap-1 transition-colors"
        >
          View All <span className="text-base">&rarr;</span>
        </Link>
      </div>

      {/* Responsive Grid: 2 columns on mobile, 3 on tablet, 6 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {FEATURED_PRODUCTS.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </section>
  );
};
