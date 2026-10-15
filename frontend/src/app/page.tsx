'use client';

import React from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { CategorySection } from '@/components/home/CategorySection';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { PromoBanners } from '@/components/home/PromoBanners';
import { PopularShopsSection } from '@/components/home/PopularShopsSection';
import { AppDownloadBanner } from '@/components/home/AppDownloadBanner';
import { useCart } from '@/context/CartContext';
import { Product } from '@/data/mockData';

export default function CustomerHomePage() {
  const { addToCart } = useCart();

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    // Future integration with product search API
  };

  return (
    <div className="w-full space-y-2 sm:space-y-4">
      {/* 1. Hero Section */}
      <HeroSection onSearch={handleSearch} />

      {/* 2. Shop by Category */}
      <CategorySection />

      {/* 3. Featured Products */}
      <FeaturedProductsSection onAddToCart={handleAddToCart} />

      {/* 4. Promotional Banners */}
      <PromoBanners />

      {/* 5. Popular Shops Near You */}
      <PopularShopsSection />

      {/* 6. Download QuickBasket App Banner */}
      <AppDownloadBanner />
    </div>
  );
}
