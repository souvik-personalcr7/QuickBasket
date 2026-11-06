'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingCart,
  Store,
  Bike,
  ShieldCheck,
  Package,
  TrendingUp,
  Headphones,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TrackOrderModal } from '@/components/orders/TrackOrderModal';

export const Footer: React.FC = () => {
  const { user, isAuthenticated, role } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isShopOwner =
    (mounted && isAuthenticated && role === 'shop_owner') ||
    (pathname ? pathname.startsWith('/shop') : false);

  const isDeliveryPartner =
    (mounted && isAuthenticated && role === 'delivery_partner') ||
    (pathname ? pathname.startsWith('/delivery') : false);

  return (
    <footer className="bg-[#0b3820] text-emerald-100/90 pt-14 pb-20 md:pb-12 mt-16 border-t border-emerald-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isShopOwner ? (
          /* ========================================================= */
          /* SHOP OWNER / MERCHANT FOOTER                              */
          /* ========================================================= */
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-emerald-900/60">
              {/* Brand Info & Registered Store Details */}
              <div className="space-y-4">
                <Link href="/shop" className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#0b3820] shadow-sm">
                    <Store className="w-5 h-5 text-[#0b3820]" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xl tracking-tight text-white leading-tight">
                        Quick<span className="text-emerald-400">Basket</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        Merchant
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-300 font-medium tracking-tight">
                      Merchant Partner Network
                    </span>
                  </div>
                </Link>

                {user?.shopDetails?.shopName && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-xs text-white">
                    <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold truncate">{user.shopDetails.shopName}</p>
                      <p className="text-[10px] text-emerald-300/70 truncate">
                        {user.shopDetails.category || 'Retail & Grocery'} &bull; Verified Store
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-emerald-200/70 leading-relaxed max-w-sm">
                  Empowering local neighborhood retailers and shop owners. Manage your storefront, inventory catalog, and incoming customer orders with 15-30 min doorstep delivery fulfillment.
                </p>
              </div>

              {/* Store Management Links */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>Store Management</span>
                </h4>
                <ul className="space-y-2 text-xs text-emerald-200/80">
                  <li>
                    <Link href="/shop" className="hover:text-white transition-colors">
                      Store Catalog & Products
                    </Link>
                  </li>
                  <li>
                    <Link href="/shop?tab=orders" className="hover:text-white transition-colors">
                      Live Store Orders
                    </Link>
                  </li>
                  <li>
                    <Link href="/addresses" className="hover:text-white transition-colors">
                      Shop Locations & Pickup Map
                    </Link>
                  </li>
                  <li>
                    <Link href="/profile" className="hover:text-white transition-colors">
                      Registered Store Details
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Merchant Operations & Guidelines */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Merchant Operations</span>
                </h4>
                <ul className="space-y-2 text-xs text-emerald-200/80">
                  <li>
                    <Link href="#partner-support" className="hover:text-white transition-colors">
                      Merchant Help Desk
                    </Link>
                  </li>
                  <li>
                    <Link href="#packaging-guide" className="hover:text-white transition-colors">
                      Order Packaging Guidelines
                    </Link>
                  </li>
                  <li>
                    <Link href="#handover-guide" className="hover:text-white transition-colors">
                      Rider Pickup & Handover
                    </Link>
                  </li>
                  <li>
                    <Link href="#payout-terms" className="hover:text-white transition-colors">
                      Daily Settlements & Payouts
                    </Link>
                  </li>
                  <li>
                    <Link href="#merchant-terms" className="hover:text-white transition-colors">
                      Merchant Partner Terms
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Partner Support & Live Desk */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-emerald-400" />
                  <span>Partner Support</span>
                </h4>
                <div className="space-y-2.5 text-xs text-emerald-200/80">
                  <p className="text-[11px] text-emerald-300/70 leading-relaxed">
                    Need immediate assistance with store inventory, customer orders, or rider dispatch?
                  </p>
                  <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60 font-mono text-[11px] text-emerald-300">
                    help-care@quickbasket.com
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/80 pt-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Support Hours: 7:00 AM – 11:00 PM Daily</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/80">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Verified Hyperlocal Partner Portal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-emerald-300/60 gap-3">
              <p>&copy; 2026 QuickBasket Merchant Portal. Empowering neighborhood commerce.</p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                <span>Real-time Stock Sync</span>
                <span>&bull;</span>
                <span>Fast Daily Settlements</span>
                <span>&bull;</span>
                <span>Verified Store Network</span>
              </div>
            </div>
          </div>
        ) : isDeliveryPartner ? (
          /* ========================================================= */
          /* DELIVERY PARTNER / RIDER FOOTER                           */
          /* ========================================================= */
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-emerald-900/60">
              {/* Brand Info & Rider Details */}
              <div className="space-y-4">
                <Link href="/delivery" className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#0b3820] shadow-sm">
                    <Bike className="w-5 h-5 text-[#0b3820]" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xl tracking-tight text-white leading-tight">
                        Quick<span className="text-emerald-400">Basket</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        Rider
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-300 font-medium tracking-tight">
                      Rider Fleet Network
                    </span>
                  </div>
                </Link>

                <p className="text-xs text-emerald-200/70 leading-relaxed max-w-sm">
                  Empowering our delivery heroes. Delivering fresh groceries and daily essentials with optimized routing, live dispatch, and reliable daily earnings.
                </p>
              </div>

              {/* Rider Operations Links */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-emerald-400" />
                  <span>Rider Portal</span>
                </h4>
                <ul className="space-y-2 text-xs text-emerald-200/80">
                  <li>
                    <Link href="/delivery" className="hover:text-white transition-colors">
                      Rider Dispatch Board
                    </Link>
                  </li>
                  <li>
                    <Link href="/delivery" className="hover:text-white transition-colors">
                      Active & Completed Deliveries
                    </Link>
                  </li>
                  <li>
                    <Link href="/profile" className="hover:text-white transition-colors">
                      Rider Profile & Vehicle Info
                    </Link>
                  </li>
                  <li>
                    <Link href="/addresses" className="hover:text-white transition-colors">
                      Delivery Hubs & Addresses
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Rider Safety & Policies */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Rider Guidelines</span>
                </h4>
                <ul className="space-y-2 text-xs text-emerald-200/80">
                  <li>
                    <Link href="#rider-safety" className="hover:text-white transition-colors">
                      Safety First Standards
                    </Link>
                  </li>
                  <li>
                    <Link href="#earnings-guide" className="hover:text-white transition-colors">
                      Weekly Payouts & Tips
                    </Link>
                  </li>
                  <li>
                    <Link href="#traffic-guidelines" className="hover:text-white transition-colors">
                      Safe Delivery Guidelines
                    </Link>
                  </li>
                  <li>
                    <Link href="#rider-terms" className="hover:text-white transition-colors">
                      Partner Agreement
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Rider Help Desk */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-emerald-400" />
                  <span>Rider Support</span>
                </h4>
                <div className="space-y-2.5 text-xs text-emerald-200/80">
                  <p className="text-[11px] text-emerald-300/70 leading-relaxed">
                    Need on-road support or delivery dispatch assistance? Contact rider operations:
                  </p>
                  <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60 font-mono text-[11px] text-emerald-300">
                    rider-support@quickbasket.com
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/80 pt-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>24/7 Roadside Assistance Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-emerald-300/60 gap-3">
              <p>&copy; 2026 QuickBasket Rider Network. All rights reserved.</p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                <span>Fast Hyperlocal Dispatch</span>
                <span>&bull;</span>
                <span>Safety First</span>
                <span>&bull;</span>
                <span>Daily Rider Settlements</span>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* CUSTOMER / GUEST FOOTER                                   */
          /* ========================================================= */
          <div>
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
                    <button
                      type="button"
                      onClick={() => setIsTrackModalOpen(true)}
                      className="hover:text-white transition-colors cursor-pointer text-left"
                    >
                      Track Order Live
                    </button>
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
                  <a
                    href="#facebook"
                    aria-label="Facebook"
                    className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-700 flex items-center justify-center text-white transition-colors text-xs font-bold"
                  >
                    f
                  </a>
                  <a
                    href="#instagram"
                    aria-label="Instagram"
                    className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-700 flex items-center justify-center text-white transition-colors text-xs font-bold"
                  >
                    ig
                  </a>
                  <a
                    href="#youtube"
                    aria-label="YouTube"
                    className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-700 flex items-center justify-center text-white transition-colors text-xs font-bold"
                  >
                    yt
                  </a>
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
        )}
      </div>
      <TrackOrderModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
      />
    </footer>
  );
};
