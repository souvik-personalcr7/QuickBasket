'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  MapPin,
  ShieldCheck,
  Tag,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function CartPage() {
  const { items, cartCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 199 || subtotal === 0 ? 0 : 25;
  const handlingFee = subtotal > 0 ? 5 : 0;
  const totalAmount = subtotal + deliveryFee + handlingFee;

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setOrderPlaced(true);
      clearCart();
    }, 1500);
  };

  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Order Placed Successfully!</h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Your hyperlocal store is currently packing your fresh order. A delivery partner will be dispatched shortly!
        </p>
        <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 max-w-sm mx-auto">
          <span>Estimated arrival in <strong>15-25 minutes</strong> at your doorstep.</span>
        </div>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-xs">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Your Basket is Empty</h1>
        <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
          Looks like you haven&apos;t added any fresh vegetables, fruits, or daily groceries to your basket yet.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-colors"
          >
            <span>Explore Fresh Items</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const deliveryAddress =
    user?.address?.street && user?.address?.city
      ? `${user.address.street}, ${user.address.city} (${user.address.postalCode || ''})`
      : 'Sector 4, Main Market, South Delhi';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Your Grocery Basket</h1>
          <p className="text-xs text-slate-500 mt-1">
            {cartCount} {cartCount === 1 ? 'item' : 'items'} ready for express doorstep delivery
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
        >
          Clear Basket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {items.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      {item.category}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{item.unit}</span>
                      <span className="text-xs font-black text-slate-900">₹{item.price}</span>
                      {item.originalPrice && (
                        <span className="text-[11px] text-slate-400 line-through">₹{item.originalPrice}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Counter and Remove */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 hover:bg-slate-200 text-slate-600 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-900">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1.5 hover:bg-slate-200 text-slate-600 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-sm font-extrabold text-slate-900 min-w-[50px] text-right">
                    ₹{item.price * item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Perks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-700 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-emerald-900 block">15-30 Min Hyperlocal Guarantee</span>
                <span className="text-emerald-700">Orders fulfilled by nearest registered store</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-700 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-amber-900 block">Free Delivery on Orders &gt; ₹199</span>
                <span className="text-amber-700">{subtotal >= 199 ? '✓ Free delivery unlocked!' : `Add ₹${199 - subtotal} more for free delivery`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout */}
        <div className="space-y-6">
          {/* Delivery Address Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Delivery Location</span>
              </span>
              {isAuthenticated ? (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Saved Address
                </span>
              ) : (
                <Link href="/login" className="text-[11px] font-bold text-emerald-700 hover:underline">
                  Sign in to edit
                </Link>
              )}
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">{deliveryAddress}</p>
          </div>

          {/* Bill Details */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 pb-2 border-b border-slate-100">Bill Summary</h2>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">₹{subtotal}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Delivery Fee</span>
                {deliveryFee === 0 ? (
                  <span className="font-bold text-emerald-600">FREE</span>
                ) : (
                  <span className="font-semibold text-slate-900">₹{deliveryFee}</span>
                )}
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Platform & Packaging Fee</span>
                <span className="font-semibold text-slate-900">₹{handlingFee}</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm font-extrabold text-slate-900">
                <span>Grand Total</span>
                <span className="text-lg text-emerald-700 font-black">₹{totalAmount}</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <div className="pt-2">
              {isAuthenticated ? (
                <button
                  type="button"
                  disabled={isCheckingOut}
                  onClick={handleCheckout}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#0f5132] hover:bg-[#166534] active:bg-[#14532d] text-white font-bold text-sm shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isCheckingOut ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Processing Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay ₹{totalAmount} & Place Order</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#0f5132] hover:bg-[#166534] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 text-center"
                  >
                    <span>Sign In to Place Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-[11px] text-center text-slate-500">
                    Signing in keeps your order history and saves your delivery addresses.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safe & Secure UPI, Cards, NetBanking or Cash on Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
