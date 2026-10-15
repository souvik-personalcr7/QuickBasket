import React from 'react';
import Link from 'next/link';

export const PromoBanners: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Banner 1: Fresh Vegetables & Fruits */}
        <div className="relative overflow-hidden rounded-2xl bg-[#dcf3e2] p-6 sm:p-8 flex items-center justify-between border border-emerald-100 shadow-[0_2px_12px_-3px_rgba(22,101,52,0.08)]">
          <div className="space-y-3 z-10 max-w-[60%]">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
              Save Big
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#0f3d23] leading-tight">
              Up to 40% OFF
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-[#15803d]">
              Fresh Vegetables & Fruits
            </p>
            <div className="pt-2">
              <Link
                href="#vegetables"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#135d38] hover:bg-[#0f4e2e] text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-xs"
              >
                Shop Now <span>&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Banner 1 Image */}
          <div className="w-32 h-32 sm:w-44 sm:h-44 relative shrink-0">
            <img
              src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80"
              alt="Fresh Vegetables & Fruits"
              className="w-full h-full object-cover rounded-2xl shadow-sm"
              loading="lazy"
            />
          </div>
        </div>

        {/* Banner 2: Daily Essentials at Best Prices */}
        <div className="relative overflow-hidden rounded-2xl bg-[#fef1d8] p-6 sm:p-8 flex items-center justify-between border border-amber-100 shadow-[0_2px_12px_-3px_rgba(180,83,9,0.08)]">
          <div className="space-y-3 z-10 max-w-[60%]">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-600 text-white shadow-xs">
              Everyday Value
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#78350f] leading-tight">
              Daily Essentials at Best Prices
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-[#b45309]">
              Snacks, beverages & pantry
            </p>
            <div className="pt-2">
              <Link
                href="#essentials"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#135d38] hover:bg-[#0f4e2e] text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-xs"
              >
                Shop Now <span>&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Banner 2 Image */}
          <div className="w-32 h-32 sm:w-44 sm:h-44 relative shrink-0">
            <img
              src="https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&auto=format&fit=crop&q=80"
              alt="Daily Essentials"
              className="w-full h-full object-cover rounded-2xl shadow-sm"
              loading="lazy"
            />
          </div>
        </div>

      </div>
    </section>
  );
};
