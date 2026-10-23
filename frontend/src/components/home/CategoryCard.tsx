'use client';

import React from 'react';
import { Category } from '@/data/mockData';

interface CategoryCardProps {
  category: Category;
  onClick?: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full flex flex-col items-center bg-white p-2.5 sm:p-4 rounded-2xl border border-slate-100/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_20px_-4px_rgba(21,128,61,0.12)] hover:border-emerald-200 transition-all duration-200 text-center cursor-pointer"
    >
      {/* Category Image Container */}
      <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-2xl ${category.bgTint} flex items-center justify-center p-2 mb-2 sm:mb-3 overflow-hidden group-hover:scale-105 transition-transform duration-200`}>
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-full object-cover rounded-xl"
          loading="lazy"
        />
      </div>

      {/* Category Label */}
      <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#15803d] transition-colors line-clamp-1 leading-tight">
        {category.name}
      </span>
    </button>
  );
};
