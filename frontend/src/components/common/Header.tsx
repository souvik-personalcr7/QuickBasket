'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Menu, X, ShoppingCart, User as UserIcon, LogOut, Store, Bike, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  cartCount?: number;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ cartCount = 0, onOpenSearch }) => {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Home');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, logout, role, getRoleRedirectPath } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Store className="w-3 h-3" /> Shop Owner
          </span>
        );
      case 'delivery_partner':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Bike className="w-3 h-3" /> Delivery Partner
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Shield className="w-3 h-3" /> Admin
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
        return 'Admin Console';
      default:
        return 'My Account & Orders';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            
            {/* Mobile Hamburger Menu Toggle */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 -ml-2 text-slate-700 hover:text-emerald-700 focus:outline-none"
                aria-label="Open menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Brand Logo & Tagline */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-[#15803d] flex items-center justify-center text-white shadow-sm group-hover:bg-[#166534] transition-colors">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl tracking-tight text-[#166534] leading-tight">
                    Quick<span className="text-[#15803d]">Basket</span>
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 tracking-tight leading-none mt-0.5">
                    Fresh Groceries, Fast Delivery
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const isActive = activeNav === link.name;
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

            {/* Right Action Icons: Search, Cart, Login/Signup or User Profile */}
            <div className="flex items-center gap-3 sm:gap-4">
              
              {/* Search Icon Button */}
              <button
                type="button"
                onClick={onOpenSearch}
                aria-label="Search products"
                className="p-2 text-slate-600 hover:text-[#15803d] hover:bg-emerald-50 rounded-full transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Cart Icon with Counter Badge */}
              <Link
                href="/cart"
                className="relative p-2 text-slate-700 hover:text-[#15803d] hover:bg-emerald-50 rounded-full transition-colors"
                aria-label="View Cart"
              >
                <ShoppingBag className="w-6 h-6" />
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[#15803d] text-white text-[10px] font-bold rounded-full px-1 shadow-sm">
                  {cartCount}
                </span>
              </Link>

              {/* Auth Section: User Dropdown or Login Button */}
              {mounted && isAuthenticated && user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-2 rounded-full border border-slate-200 hover:border-emerald-300 hover:bg-slate-50 transition-all focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {user.name ? user.name.charAt(0) : <UserIcon className="w-4 h-4" />}
                    </div>
                    <div className="hidden lg:flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold capitalize">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
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
                          {user.role === 'shop_owner' && <Store className="w-4 h-4 text-emerald-600" />}
                          {user.role === 'delivery_partner' && <Bike className="w-4 h-4 text-emerald-600" />}
                          {user.role === 'customer' && <ShoppingBag className="w-4 h-4 text-emerald-600" />}
                          <span>{getRolePortalName(user.role)}</span>
                        </Link>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
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
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs">
          <div className="fixed top-0 left-0 bottom-0 w-3/4 max-w-xs bg-white p-6 shadow-xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#15803d] flex items-center justify-center text-white">
                    <ShoppingCart className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-extrabold text-lg text-[#166534]">QuickBasket</span>
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

              <nav className="mt-4 space-y-2">
                {navLinks.map((link) => (
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
                ))}
              </nav>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <Link
                  href="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#15803d]"
                >
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Shop Owner Portal</span>
                </Link>
                <Link
                  href="/delivery"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#15803d]"
                >
                  <Bike className="w-4 h-4 text-emerald-600" />
                  <span>Delivery Partner App</span>
                </Link>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              {mounted && isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-full shadow-sm text-center transition-colors"
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
    </>
  );
};

