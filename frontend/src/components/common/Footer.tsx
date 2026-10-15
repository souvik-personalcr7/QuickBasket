import React from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0b3820] text-emerald-100/90 pt-14 pb-20 md:pb-12 mt-16 border-t border-emerald-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-emerald-900/60">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#0b3820] shadow-sm">
                <ShoppingCart className="w-5 h-5 text-[#0b3820]" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-white leading-tight">
                  Quick<span className="text-emerald-400">Basket</span>
                </span>
                <span className="text-[10px] text-emerald-300 font-medium tracking-tight">
                  Fresh Groceries, Fast Delivery
                </span>
              </div>
            </Link>
            <p className="text-xs text-emerald-200/70 leading-relaxed max-w-sm">
              Your neighborhood quick commerce partner delivering fresh produce, daily essentials, and local specialties straight to your doorstep.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide">Quick Links</h4>
            <ul className="space-y-2 text-xs text-emerald-200/80">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link href="#categories" className="hover:text-white transition-colors">Categories</Link>
              </li>
              <li>
                <Link href="#deals" className="hover:text-white transition-colors">Deals</Link>
              </li>
              <li>
                <Link href="#shops" className="hover:text-white transition-colors">Shops</Link>
              </li>
              <li>
                <Link href="#track-order" className="hover:text-white transition-colors">Track Order</Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide">Customer Support</h4>
            <ul className="space-y-2 text-xs text-emerald-200/80">
              <li>
                <Link href="#help" className="hover:text-white transition-colors">Help Center</Link>
              </li>
              <li>
                <Link href="#contact" className="hover:text-white transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link href="#terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
              </li>
              <li>
                <Link href="#privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              </li>
            </ul>
          </div>

          {/* Follow Us / Socials */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide">Follow Us</h4>
            <div className="flex items-center gap-3 pt-1">
              {/* Facebook */}
              <a
                href="#facebook"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-700 flex items-center justify-center text-white transition-colors text-xs font-bold"
              >
                f
              </a>
              {/* Instagram */}
              <a
                href="#instagram"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-700 flex items-center justify-center text-white transition-colors text-xs font-bold"
              >
                ig
              </a>
              {/* YouTube */}
              <a
                href="#youtube"
                aria-label="YouTube"
                className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-700 flex items-center justify-center text-white transition-colors text-xs font-bold"
              >
                yt
              </a>
              {/* X */}
              <a
                href="#x"
                aria-label="X"
                className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-700 flex items-center justify-center text-white transition-colors text-xs font-bold"
              >
                x
              </a>
            </div>
            <p className="text-[11px] text-emerald-300/60 pt-2">
              Stay connected for exclusive weekly discounts and regional market updates.
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-emerald-300/60 gap-3">
          <p>&copy; 2026 QuickBasket. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Fast Delivery</span>
            <span>&bull;</span>
            <span>100% Quality Guaranteed</span>
            <span>&bull;</span>
            <span>Secure Payments</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
