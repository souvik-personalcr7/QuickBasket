'use client';

import React, { useState } from 'react';
import { CATEGORIES } from '@/data/mockData';
import { CategoryCard } from './CategoryCard';
import { AllCategoriesModal } from './AllCategoriesModal';

interface CategorySectionProps {
  onSelectCategory?: (categoryName: string) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({ onSelectCategory }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelect = (categoryName: string) => {
    onSelectCategory?.(categoryName);
  };

  return (
    <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f3d23] tracking-tight">
            Shop by Category
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Explore fresh daily essentials and supermarket departments
          </p>
        </div>

        {/* Fully workable View All button */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-xs sm:text-sm font-bold text-[#15803d] hover:text-[#166534] flex items-center gap-1 transition-colors cursor-pointer group whitespace-nowrap shrink-0"
          aria-label="View all categories"
        >
          <span>View All</span>
          <span className="text-base group-hover:translate-x-0.5 transition-transform">&rarr;</span>
        </button>
      </div>

      {/* Grid of initial 7 categories */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
        {CATEGORIES.slice(0, 7).map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            onClick={() => handleSelect(cat.name)}
          />
        ))}
      </div>

      {/* Interactive All Categories Modal */}
      <AllCategoriesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectCategory={handleSelect}
      />
    </section>
  );
};
