import React from 'react';
import { Tag, Sparkles, Navigation } from 'lucide-react';

export const AppDownloadBanner: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="relative overflow-hidden rounded-3xl bg-[#dff4e5] p-6 sm:p-10 border border-emerald-100 shadow-[0_4px_20px_-4px_rgba(22,101,52,0.08)]">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
          
          {/* Left: Smartphone Mockup */}
          <div className="md:col-span-4 flex justify-center md:justify-start">
            <div className="relative w-44 sm:w-48 aspect-[9/18] bg-slate-900 rounded-[32px] p-2 shadow-2xl border-4 border-slate-800 transform rotate-[-3deg] hover:rotate-0 transition-transform duration-300">
              {/* Phone notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-3 bg-slate-800 rounded-full z-20" />
              
              {/* Phone screen preview */}
              <div className="w-full h-full bg-emerald-50 rounded-[24px] overflow-hidden p-3 flex flex-col justify-between pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#0f3d23]">
                    <span>QuickBasket</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="h-10 bg-[#15803d] rounded-lg p-1.5 text-white text-[9px] font-semibold leading-tight">
                    Fresh Groceries in 30 Mins
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <div className="h-12 bg-white rounded-md shadow-xs" />
                    <div className="h-12 bg-white rounded-md shadow-xs" />
                  </div>
                </div>
                <div className="h-6 bg-[#0f5132] rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                  Order Now
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Title, Subtitle & Download App Buttons */}
          <div className="md:col-span-5 space-y-4 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-black text-[#0f3d23] tracking-tight">
              Download QuickBasket App
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm leading-relaxed">
              Get exclusive offers, faster checkout and a better shopping experience.
            </p>

            {/* App Store / Google Play Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
              {/* Google Play */}
              <a
                href="#google-play"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors"
              >
                <div className="w-5 h-5 flex items-center justify-center text-white font-bold text-xs">
                  ▶
                </div>
                <div className="text-left leading-none">
                  <span className="text-[9px] text-slate-400 block uppercase">GET IT ON</span>
                  <span className="text-xs font-bold text-white">Google Play</span>
                </div>
              </a>

              {/* App Store */}
              <a
                href="#app-store"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors"
              >
                <div className="w-5 h-5 flex items-center justify-center text-white font-bold text-xs">
                  
                </div>
                <div className="text-left leading-none">
                  <span className="text-[9px] text-slate-400 block uppercase">Download on the</span>
                  <span className="text-xs font-bold text-white">App Store</span>
                </div>
              </a>
            </div>
          </div>

          {/* Right: Feature Highlights with Icons */}
          <div className="md:col-span-3 space-y-3 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-emerald-200/80 md:pl-6">
            
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900">
              <div className="w-7 h-7 rounded-lg bg-[#15803d]/15 text-[#15803d] flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <span>Exclusive Deals</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900">
              <div className="w-7 h-7 rounded-lg bg-[#15803d]/15 text-[#15803d] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>Easy Ordering</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900">
              <div className="w-7 h-7 rounded-lg bg-[#15803d]/15 text-[#15803d] flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <span>Real-time Tracking</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
