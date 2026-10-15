import React from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/data/mockData';
import { CategoryCard } from './CategoryCard';

export const CategorySection: React.FC = () => {
  return (
    <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f3d23] tracking-tight">
          Shop by Category
        </h2>
        <Link
          href="#all-categories"
          className="text-xs sm:text-sm font-bold text-[#15803d] hover:text-[#166534] flex items-center gap-1 transition-colors"
        >
          View All <span className="text-base">&rarr;</span>
        </Link>
      </div>

      {/* Grid of 7 categories matching reference */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
        {CATEGORIES.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </section>
  );
};
