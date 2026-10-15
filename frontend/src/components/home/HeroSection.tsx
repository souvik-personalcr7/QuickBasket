'use client';

import React from 'react';
import { Search, Truck, ShieldCheck, Tag, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onSearch?: (query: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
  const [query, setQuery] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query.trim());
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#ebf7ee] via-[#f1faf3] to-[#e0f4e6] rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-4 lg:my-6 border border-emerald-100/60 shadow-[0_4px_25px_-5px_rgba(22,101,52,0.06)]">
      {/* Decorative leafy blurs */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-60 h-60 bg-green-200/20 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Heading, Subtitle, Search, Reassurance Badges */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Title */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight text-[#0f3d23] leading-[1.15]">
                Fresh Groceries <br />
                <span className="text-[#15803d]">Delivered to Your Door</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-lg leading-relaxed">
                Get your daily essentials, fresh produce and more from your nearby stores. Quick. Easy. Reliable.
              </p>
            </div>

            {/* Search Input Bar */}
            <form onSubmit={handleSubmit} className="max-w-xl">
              <div className="relative flex items-center bg-white rounded-full p-1.5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-emerald-100 hover:border-emerald-300 transition-colors">
                <Search className="w-5 h-5 text-slate-400 ml-3.5 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for products, categories or brands..."
                  className="w-full pl-3 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="w-10 h-10 rounded-full bg-[#135d38] hover:bg-[#0f4e2e] text-white flex items-center justify-center shrink-0 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* 3 Reassurance Badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2 max-w-xl">
              
              {/* Fast Delivery */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-100/70 text-[#15803d] flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-xs font-bold text-slate-900 leading-tight">Fast Delivery</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-tight">Within 30-60 mins</p>
                </div>
              </div>

              {/* Fresh & Quality */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-100/70 text-[#15803d] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-xs font-bold text-slate-900 leading-tight">Fresh & Quality</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-tight">100% Guaranteed</p>
                </div>
              </div>

              {/* Best Prices */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-100/70 text-[#15803d] flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-xs font-bold text-slate-900 leading-tight">Best Prices</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-tight">Everyday</p>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Hero Basket Visual & "Good Food Better Life" Badge */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            
            {/* Visual Container */}
            <div className="relative w-full max-w-[380px] sm:max-w-[420px] aspect-[4/3] flex items-center justify-center">
              
              {/* Playful Floating Badge "Good Food Better Life" */}
              <div className="absolute top-2 right-2 sm:right-6 z-10 text-right transform rotate-[-4deg]">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-xs rounded-full shadow-xs border border-emerald-100">
                  <Sparkles className="w-3.5 h-3.5 text-[#15803d]" />
                  <span className="font-serif italic font-bold text-xs sm:text-sm text-[#135d38]">
                    Good Food Better Life
                  </span>
                </div>
              </div>

              {/* Basket Image Mockup */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden group">
                <img
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80"
                  alt="QuickBasket Fresh Produce"
                  className="w-full h-full object-cover rounded-2xl drop-shadow-md group-hover:scale-102 transition-transform duration-300"
                />
                
                {/* Simulated QuickBasket Green Basket Overlay Badge */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#135d38]/90 backdrop-blur-xs text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  QuickBasket Express
                </div>
              </div>

            </div>

            {/* Carousel Navigation Dots */}
            <div className="flex items-center gap-1.5 mt-4">
              <span className="w-6 h-2 rounded-full bg-[#15803d]" />
              <span className="w-2 h-2 rounded-full bg-emerald-200" />
              <span className="w-2 h-2 rounded-full bg-emerald-200" />
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
