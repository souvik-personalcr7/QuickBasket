'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu, X, ShoppingCart, User as UserIcon, LogOut, Store, Bike, Shield, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TrackOrderModal } from '@/components/orders/TrackOrderModal';

interface HeaderProps {
  cartCount?: number;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ cartCount = 0 }) => {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Home');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, logout, role, getRoleRedirectPath } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Categories', href: '#categories' },
    { name: 'Deals', href: '#deals' },
    { name: 'Shops', href: '#shops' },
    { name: 'Track Order', href: '#track-order' },
  ];

  const getRoleBadge = (userRole?: string) => {
    switch (userRole) {
      case 'shop_owner':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Store className="w-3 h-3 text-emerald-700" /> Shop Owner
          </span>
        );
      case 'delivery_partner':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Bike className="w-3 h-3 text-emerald-700" /> Delivery Partner
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Shield className="w-3 h-3 text-emerald-700" /> Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Customer
          </span>
        );
    }
  };

  const getRolePortalName = (userRole?: string) => {
    switch (userRole) {
      case 'shop_owner':
        return 'Shop Management Portal';
      case 'delivery_partner':
        return 'Delivery Partner Dashboard';
      case 'admin':
      default:
        return 'My Account & Orders';
    }
  };

  const pathname = usePathname();
  const isShopActive = pathname === '/shop' || (pathname ? pathname.startsWith('/shop/') : false);
  const isAddressesActive = pathname === '/addresses' || (pathname ? pathname.startsWith('/addresses/') : false);
  const isProfileActive = pathname === '/profile' || (pathname ? pathname.startsWith('/profile/') : false);
  const isDeliveryActive = pathname === '/delivery' || (pathname ? pathname.startsWith('/delivery/') : false);

  const isDeliveryPartner = mounted && isAuthenticated && role === 'delivery_partner';
  const isShopOwner = mounted && isAuthenticated && role === 'shop_owner';
  const isStaffPortal = isDeliveryPartner || isShopOwner;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            
            {/* Mobile Hamburger Menu Toggle */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileMenuOpen((prev) => !prev);
                }}
                className="p-2 text-slate-700 hover:text-emerald-700 focus:outline-none cursor-pointer touch-manipulation active:scale-95 transition-transform"
                aria-label="Open menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Brand Logo & Tagline: Consistent Brand Colors */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link
                href={isDeliveryPartner ? "/delivery" : isShopOwner ? "/shop" : "/"}
                className="flex items-center gap-2 sm:gap-2.5 group min-w-0"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#15803d] flex items-center justify-center text-white shadow-sm group-hover:bg-[#166534] transition-colors shrink-0">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#166534] leading-tight truncate">
                    Quick<span className="text-[#15803d]">Basket</span>
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 tracking-tight leading-none mt-0.5 truncate hidden xs:block">
                    Fresh Groceries, Fast Delivery
                  </span>
                </div>
              </Link>

              {isDeliveryPartner && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Bike className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Rider</span>
                </span>
              )}

              {isShopOwner && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Store className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Merchant</span>
                </span>
              )}
            </div>

            {/* Desktop Navigation Links: Delivery vs Shop Owner vs Customer */}
            {isDeliveryPartner ? (
              <nav className="hidden md:flex items-center gap-3">
                <Link
                  href="/delivery"
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                    isDeliveryActive
                      ? 'bg-[#15803d] text-white shadow-xs'
                      : 'text-slate-700 hover:text-[#15803d] hover:bg-emerald-50 border border-transparent hover:border-emerald-200'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                  <span>Rider Dispatch Board</span>
                </Link>
                <Link
                  href="/profile"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isProfileActive
                      ? 'bg-emerald-100 text-[#15803d] border border-emerald-200 font-bold'
                      : 'text-slate-700 hover:text-[#15803d] hover:bg-emerald-50 border border-transparent hover:border-emerald-200'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Rider Details</span>
                </Link>
              </nav>
            ) : isShopOwner ? (
              <nav className="hidden md:flex items-center gap-3">
                <Link
                  href="/shop"
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                    isShopActive
                      ? 'bg-[#15803d] text-white shadow-xs'
                      : 'text-slate-700 hover:text-[#15803d] hover:bg-emerald-50 border border-transparent hover:border-emerald-200'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Store Catalog & Orders</span>
                </Link>
                <Link
                  href="/addresses"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isAddressesActive
                      ? 'bg-emerald-100 text-[#15803d] border border-emerald-200 font-bold'
                      : 'text-slate-700 hover:text-[#15803d] hover:bg-emerald-50 border border-transparent hover:border-emerald-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>Shop Locations</span>
                </Link>
                <Link
                  href="/profile"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isProfileActive
                      ? 'bg-emerald-100 text-[#15803d] border border-emerald-200 font-bold'
                      : 'text-slate-700 hover:text-[#15803d] hover:bg-emerald-50 border border-transparent hover:border-emerald-200'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Store Details</span>
                </Link>
              </nav>
            ) : (
              <nav className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => {
                  const isActive = activeNav === link.name;
                  if (link.name === 'Track Order') {
                    return (
                      <button
                        key={link.name}
                        type="button"
                        onClick={() => {
                          setActiveNav(link.name);
                          setIsTrackModalOpen(true);
                        }}
                        className={`relative text-sm font-semibold transition-colors py-1 cursor-pointer ${
                          isActive
                            ? 'text-[#15803d]'
                            : 'text-slate-600 hover:text-[#15803d]'
                        }`}
                      >
                        {link.name}
                        {isActive && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#15803d] rounded-full" />
                        )}
                      </button>
                    );
                  }
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setActiveNav(link.name)}
                      className={`relative text-sm font-semibold transition-colors py-1 ${
                        isActive
                          ? 'text-[#15803d]'
                          : 'text-slate-600 hover:text-[#15803d]'
                      }`}
                    >
                      {link.name}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#15803d] rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right Action Area */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {/* Only show Cart if NOT a Delivery Partner AND NOT a Shop Owner */}
              {!isStaffPortal && (
                <Link
                  href="/cart"
                  className="relative p-2 text-slate-700 hover:text-[#15803d] hover:bg-emerald-50 rounded-full transition-colors"
                  aria-label="View Cart"
                >
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[#15803d] text-white text-[10px] font-bold rounded-full px-1 shadow-sm">
                    {cartCount}
                  </span>
                </Link>
              )}

              {/* Auth Section: User Dropdown or Login Button (Always visible on mobile!) */}
              {mounted && isAuthenticated && user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserDropdownOpen(!userDropdownOpen);
                    }}
                    aria-label="User account menu"
                    className="flex items-center gap-2 p-1 lg:pl-1.5 lg:pr-3.5 rounded-full border border-slate-200/90 hover:border-emerald-400 hover:bg-emerald-50/50 shadow-xs transition-all focus:outline-none cursor-pointer touch-manipulation"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {user.name ? user.name.charAt(0) : <UserIcon className="w-4 h-4" />}
                    </div>
                    <div className="hidden lg:flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold capitalize">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate mb-1.5">{user.email}</p>
                        <div>{getRoleBadge(user.role)}</div>
                      </div>

                      <div className="py-1">
                        <Link
                          href={getRoleRedirectPath(user.role)}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                        >
                          {isDeliveryPartner ? (
                            <Bike className="w-4 h-4 text-emerald-600" />
                          ) : user.role === 'shop_owner' ? (
                            <Store className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-emerald-600" />
                          )}
                          <span>{getRolePortalName(user.role)}</span>
                        </Link>

                        {/* Customer & Shop Owner Addresses Link */}
                        {(user.role === 'customer' || user.role === 'shop_owner') && (
                          <Link
                            href="/addresses"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                          >
                            <MapPin className="w-4 h-4 text-emerald-600" />
                            <span>{user.role === 'shop_owner' ? 'Shop Locations' : 'My Addresses'}</span>
                          </Link>
                        )}

                        <Link
                          href="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-slate-500" />
                          <span>{
                            isDeliveryPartner
                              ? 'Rider Profile & Fleet Info'
                              : isShopOwner
                              ? 'Store Profile & Details'
                              : 'My Profile'
                          }</span>
                        </Link>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Mobile User Icon (Always visible on mobile when logged out) */}
                  <Link
                    href="/login"
                    aria-label="User Account / Sign In"
                    className="sm:hidden p-1.5 text-slate-700 hover:text-[#15803d] hover:bg-emerald-50 rounded-full transition-colors flex items-center justify-center cursor-pointer touch-manipulation"
                    title="Account / Login"
                  >
                    <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600 hover:text-emerald-700 hover:border-emerald-400 shadow-2xs">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  </Link>

                  {/* Desktop Login Button */}
                  <Link
                    href="/login"
                    className="hidden sm:inline-flex items-center justify-center px-5 py-2 text-sm font-semibold text-white bg-[#0f5132] hover:bg-[#166534] rounded-full shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:ring-offset-1"
                  >
                    Login / Sign Up
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setMobileMenuOpen(false);
            }
          }}
        >
          <div
            className="fixed top-0 left-0 bottom-0 w-3/4 max-w-xs bg-white p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#15803d] flex items-center justify-center text-white">
                    <ShoppingCart className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-extrabold text-lg text-[#166534]">
                    QuickBasket
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {mounted && isAuthenticated && user && (
                <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate mb-1">{user.email}</p>
                  {getRoleBadge(user.role)}
                </div>
              )}

              {/* Mobile Links: Delivery vs Shop Owner vs Customer */}
              {isDeliveryPartner ? (
                <nav className="mt-4 space-y-2">
                  <Link
                    href="/delivery"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold rounded-xl bg-emerald-50 text-[#15803d] border border-emerald-200"
                  >
                    <Bike className="w-4 h-4 text-[#15803d]" />
                    <span>Rider Dispatch Board</span>
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-xl text-slate-700 hover:bg-slate-50"
                  >
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <span>Rider Fleet Profile</span>
                  </Link>
                </nav>
              ) : isShopOwner ? (
                <nav className="mt-4 space-y-2">
                  <Link
                    href="/shop"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold rounded-xl bg-emerald-50 text-[#15803d] border border-emerald-200"
                  >
                    <Store className="w-4 h-4 text-[#15803d]" />
                    <span>Store Catalog & Orders</span>
                  </Link>
                  <Link
                    href="/addresses"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-xl text-slate-700 hover:bg-slate-50"
                  >
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span>Shop Locations</span>
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-xl text-slate-700 hover:bg-slate-50"
                  >
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <span>Storefront Profile & Details</span>
                  </Link>
                </nav>
              ) : (
                <nav className="mt-4 space-y-2">
                  {navLinks.map((link) => {
                    if (link.name === 'Track Order') {
                      return (
                        <button
                          key={link.name}
                          type="button"
                          onClick={() => {
                            setActiveNav(link.name);
                            setMobileMenuOpen(false);
                            setIsTrackModalOpen(true);
                          }}
                          className={`w-full text-left block px-3 py-2 text-base font-semibold rounded-lg cursor-pointer ${
                            activeNav === link.name
                              ? 'bg-emerald-50 text-[#15803d]'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {link.name}
                        </button>
                      );
                    }
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => {
                          setActiveNav(link.name);
                          setMobileMenuOpen(false);
                        }}
                        className={`block px-3 py-2 text-base font-semibold rounded-lg ${
                          activeNav === link.name
                            ? 'bg-emerald-50 text-[#15803d]'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {link.name}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100">
              {mounted && isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-full shadow-sm text-center transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-[#0f5132] hover:bg-[#166534] rounded-full shadow-sm text-center"
                >
                  Login / Sign Up
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Order Tracking Modal */}
      <TrackOrderModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
      />
    </>
  );
};

