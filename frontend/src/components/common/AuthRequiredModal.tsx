'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Heart, LogIn, UserPlus, X, Sparkles, ShieldCheck, ShoppingBag } from 'lucide-react';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  mode?: 'shopping' | 'favorite';
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  mode = 'shopping',
}) => {
  const router = useRouter();
  const pathname = usePathname() || '/';

  const isShopping = mode === 'shopping';
  const defaultTitle = isShopping ? 'Sign In to Start Shopping' : 'Sign In to Save Favorites';
  const defaultDescription = isShopping
    ? 'Please log in or create an account to start shopping, add items from neighborhood stores to your cart, and enjoy fast doorstep delivery.'
    : 'Please log in or create an account to save your favorite groceries, sync your wishlist across all devices, and reorder quickly.';

  const displayTitle = title || defaultTitle;
  const displayDescription = description || defaultDescription;

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  // Handle ESC key and scroll locking
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const redirectUrl = encodeURIComponent(pathname);

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Accent Bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            isShopping
              ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-[#15803d]'
              : 'bg-gradient-to-r from-emerald-500 via-rose-500 to-[#15803d]'
          }`}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Highlighted Icon Badge */}
        {isShopping ? (
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#15803d] shadow-xs mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-[#15803d]" />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#15803d] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
        ) : (
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-xs mx-auto mb-4">
            <Heart className="w-8 h-8 sm:w-10 sm:h-10 fill-rose-500 text-rose-500" />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
        )}

        {/* Modal Title */}
        <h3
          id="auth-modal-title"
          className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug"
        >
          {displayTitle}
        </h3>

        {/* Modal Description */}
        <p className="text-xs sm:text-sm text-slate-600 mt-2 mb-6 leading-relaxed max-w-xs sm:max-w-sm mx-auto">
          {displayDescription}
        </p>

        {/* Reassurance Micro-List */}
        <div className="bg-slate-50 rounded-2xl p-3 mb-6 text-left border border-slate-100/80">
          {isShopping ? (
            <>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Shop authentic items from verified neighborhood stores</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Superfast 15-30 min doorstep delivery & live order tracking</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sync wishlist across mobile & desktop</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Fast 1-click checkout for your favorite items</span>
              </div>
            </>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2.5">
          {/* Log In Button */}
          <button
            type="button"
            onClick={() => handleNavigate(`/login?redirect=${redirectUrl}`)}
            className="w-full py-3 px-4 rounded-xl font-bold text-white bg-[#135d38] hover:bg-[#0f4e2e] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer active:scale-[0.99]"
          >
            <LogIn className="w-4 h-4" />
            <span>Log In to Account</span>
          </button>

          {/* Sign Up Button */}
          <button
            type="button"
            onClick={() => handleNavigate(`/signup?redirect=${redirectUrl}`)}
            className="w-full py-3 px-4 rounded-xl font-bold text-[#135d38] bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer active:scale-[0.99]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New Account</span>
          </button>
        </div>

        {/* Secondary Dismiss Button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            Continue browsing
          </button>
        </div>
      </div>
    </div>
  );
};

